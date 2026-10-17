import { MAX_NOTE_LENGTH, HISTORY_PAGE_SIZE } from '@/features/transfers/constants/limits';
import { z } from 'zod';
import { TransferError } from '@/features/transfers/domain/errors';
import { initialAccount, recipients } from '@/features/transfers/constants/demoData';
import type { Account, TransferDraft, TransferReceipt } from '@/features/transfers/domain/types';

type SqlValue = string | number | null;
export interface LedgerConnection {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlValue[]): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
}
export interface LedgerDatabase extends LedgerConnection {
  withExclusiveTransactionAsync(task: (tx: LedgerConnection) => Promise<void>): Promise<void>;
}
export interface TransferAttempt {
  idempotencyKey: string;
  draft: TransferDraft;
}
export interface HistoryPage {
  items: TransferReceipt[];
  nextCursor?: number;
}
const attemptSchema = z.object({
  idempotencyKey: z.string().uuid(),
  draft: z.object({
    recipientId: z.string().refine((id) => recipients.some((recipient) => recipient.id === id)),
    amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    note: z.string().trim().max(MAX_NOTE_LENGTH),
  }),
});

export function createLedger(db: LedgerDatabase) {
  // Serialize this app's writes; SQLite constraints/transactions remain the final consistency boundary.
  let tail: Promise<void> = Promise.resolve();
  function transaction(task: (tx: LedgerConnection) => Promise<void>) {
    const result = tail.then(() => db.withExclusiveTransactionAsync(task));
    tail = result.catch(() => undefined);
    return result;
  }
  function validate(input: TransferAttempt): TransferAttempt {
    const result = attemptSchema.safeParse(input);
    if (!result.success)
      throw new TransferError(
        'invalid',
        'These transfer details are invalid. Review them and try again.',
      );
    return result.data;
  }
  async function find(
    key: string,
    connection: LedgerConnection = db,
  ): Promise<TransferReceipt | null> {
    const row = await connection.getFirstAsync<{ receipt: string }>(
      'SELECT receipt FROM transfers WHERE request_key = ?',
      key,
    );
    return row ? (JSON.parse(row.receipt) as TransferReceipt) : null;
  }
  return {
    async initialize() {
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
      const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      if (version && version.user_version > 1)
        throw new Error('This data requires a newer version of Aster.');
      await transaction(async (tx) => {
        await tx.execAsync(`CREATE TABLE IF NOT EXISTS wallet (id INTEGER PRIMARY KEY CHECK(id = 1), balance INTEGER NOT NULL CHECK(balance >= 0));
          CREATE TABLE IF NOT EXISTS transfers (sequence INTEGER PRIMARY KEY AUTOINCREMENT, request_key TEXT NOT NULL UNIQUE, receipt TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS pending (id INTEGER PRIMARY KEY CHECK(id = 1), attempt TEXT NOT NULL);
          PRAGMA user_version = 1;`);
        await tx.runAsync(
          'INSERT OR IGNORE INTO wallet (id, balance) VALUES (1, ?)',
          initialAccount.balanceMinor,
        );
      });
    },
    async account(): Promise<Account> {
      const row = await db.getFirstAsync<{ balance: number }>(
        'SELECT balance FROM wallet WHERE id = 1',
      );
      if (!row || !Number.isSafeInteger(row.balance) || row.balance < 0)
        throw new Error('Account data is unavailable.');
      return { ...initialAccount, balanceMinor: row.balance };
    },
    find,
    async pending(): Promise<TransferAttempt | null> {
      const row = await db.getFirstAsync<{ attempt: string }>(
        'SELECT attempt FROM pending WHERE id = 1',
      );
      return row ? validate(JSON.parse(row.attempt)) : null;
    },
    async savePending(input: TransferAttempt) {
      const attempt = validate(input);
      await transaction(async (tx) => {
        const row = await tx.getFirstAsync<{ attempt: string }>(
          'SELECT attempt FROM pending WHERE id = 1',
        );
        if (row && row.attempt !== JSON.stringify(attempt))
          throw new TransferError(
            'conflict',
            'Resolve the previous transfer before sending another.',
          );
        await tx.runAsync(
          'INSERT OR IGNORE INTO pending (id, attempt) VALUES (1, ?)',
          JSON.stringify(attempt),
        );
      });
    },
    async clearPending(key: string) {
      await transaction(async (tx) => {
        await tx.runAsync(
          "DELETE FROM pending WHERE id = 1 AND json_extract(attempt, '$.idempotencyKey') = ?",
          key,
        );
      });
    },
    async complete(
      input: TransferAttempt,
      id: string,
      createdAt: string,
    ): Promise<TransferReceipt> {
      const attempt = validate(input);
      let receipt: TransferReceipt | undefined;
      await transaction(async (tx) => {
        const existing = await find(attempt.idempotencyKey, tx);
        if (existing) {
          if (
            existing.recipientId !== attempt.draft.recipientId ||
            existing.amountMinor !== attempt.draft.amountMinor ||
            existing.note !== attempt.draft.note
          )
            throw new TransferError(
              'conflict',
              'This transfer reference has different details. Review the transfer again.',
            );
          receipt = existing;
          return;
        }
        const result = await tx.runAsync(
          'UPDATE wallet SET balance = balance - ? WHERE id = 1 AND balance >= ?',
          attempt.draft.amountMinor,
          attempt.draft.amountMinor,
        );
        if (result.changes !== 1)
          throw new TransferError(
            'funds',
            'Your balance changed. There isn’t enough money for this transfer. Edit the amount.',
          );
        const balance = await tx.getFirstAsync<{ balance: number }>(
          'SELECT balance FROM wallet WHERE id = 1',
        );
        if (!balance) throw new Error('Account data is unavailable.');
        const recipient = recipients.find((item) => item.id === attempt.draft.recipientId)!;
        receipt = {
          ...attempt.draft,
          id,
          idempotencyKey: attempt.idempotencyKey,
          recipient: { ...recipient },
          createdAt,
          balanceAfterMinor: balance.balance,
          status: 'completed',
        };
        await tx.runAsync(
          'INSERT INTO transfers (request_key, receipt) VALUES (?, ?)',
          attempt.idempotencyKey,
          JSON.stringify(receipt),
        );
      });
      if (!receipt) throw new Error('Transfer did not produce a receipt.');
      return receipt;
    },
    async history(
      cursor = Number.MAX_SAFE_INTEGER,
      limit = HISTORY_PAGE_SIZE,
    ): Promise<HistoryPage> {
      if (!Number.isSafeInteger(cursor) || !Number.isInteger(limit) || limit < 1 || limit > 100)
        throw new Error('Invalid history page.');
      const rows = await db.getAllAsync<{ sequence: number; receipt: string }>(
        'SELECT sequence, receipt FROM transfers WHERE sequence < ? ORDER BY sequence DESC LIMIT ?',
        cursor,
        limit + 1,
      );
      const page = rows.slice(0, limit);
      return {
        items: page.map((row) => JSON.parse(row.receipt) as TransferReceipt),
        nextCursor: rows.length > limit ? page.at(-1)?.sequence : undefined,
      };
    },
  };
}
export type Ledger = ReturnType<typeof createLedger>;
