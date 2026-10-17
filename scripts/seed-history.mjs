import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import process from 'node:process';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { initialAccount, recipients } from '../src/features/transfers/constants/demoData.ts';

// Operate only on a deliberately named copy of an empty simulator ledger.
const path = process.argv[2];
assert(
  path && basename(path) === 'aster-performance.db',
  'Pass a copied aster-performance.db file.',
);
assert(existsSync(path), 'Copy an initialized, empty simulator ledger first.');
const db = new DatabaseSync(path);
try {
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM transfers').get().count, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM pending').get().count, 0);
  assert.equal(
    db.prepare('SELECT balance FROM wallet WHERE id = 1').get().balance,
    initialAccount.balanceMinor,
  );
  db.exec('BEGIN IMMEDIATE');
  try {
    const insert = db.prepare('INSERT INTO transfers (request_key, receipt) VALUES (?, ?)');
    for (let index = 0; index < 1000; index++) {
      const recipient = recipients[index % recipients.length];
      const idempotencyKey = randomUUID();
      insert.run(
        idempotencyKey,
        JSON.stringify({
          id: `AST-PERF-${String(index + 1).padStart(4, '0')}`,
          idempotencyKey,
          recipientId: recipient.id,
          recipient,
          amountMinor: 1,
          note: `Synthetic performance fixture ${index + 1}`,
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
          balanceAfterMinor: initialAccount.balanceMinor - index - 1,
          status: 'completed',
        }),
      );
    }
    db.prepare('UPDATE wallet SET balance = balance - 1000 WHERE id = 1').run();
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM transfers').get().count, 1000);
    assert.equal(
      db.prepare('SELECT balance FROM wallet WHERE id = 1').get().balance,
      initialAccount.balanceMinor - 1000,
    );
    db.exec('COMMIT; PRAGMA wal_checkpoint(TRUNCATE);');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  process.stdout.write('Seeded 1,000 fictional RM 0.01 transfers; total debit RM 10.00.\n');
} finally {
  db.close();
}
