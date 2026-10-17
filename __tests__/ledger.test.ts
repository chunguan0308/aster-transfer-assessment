import {
  createLedger,
  type LedgerConnection,
  type LedgerDatabase,
} from '@/features/transfers/services/ledger';

const { DatabaseSync } = jest.requireActual('node:sqlite');
const key = '00000000-0000-4000-8000-000000000001';
const request = {
  idempotencyKey: key,
  draft: { recipientId: 'aisha', amountMinor: 12345, note: 'Lunch' },
};
let database: InstanceType<typeof DatabaseSync>;
let ledger: ReturnType<typeof createLedger>;
let connection: LedgerDatabase;

beforeEach(async () => {
  database = new DatabaseSync(':memory:');
  const sql: LedgerConnection = {
    async execAsync(query) {
      database.exec(query);
    },
    async runAsync(query, ...params) {
      return database.prepare(query).run(...params);
    },
    async getFirstAsync<T>(query: string, ...params: (string | number | null)[]) {
      return (database.prepare(query).get(...params) as T) ?? null;
    },
    async getAllAsync<T>(query: string, ...params: (string | number | null)[]) {
      return database.prepare(query).all(...params) as T[];
    },
  };
  connection = {
    ...sql,
    async withExclusiveTransactionAsync(task) {
      database.exec('BEGIN IMMEDIATE');
      try {
        await task(sql);
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
  ledger = createLedger(connection);
  await ledger.initialize();
});
afterEach(() => database.close());

test('debits integer sen atomically and persists matching receipt', async () => {
  await ledger.savePending(request);
  const receipt = await ledger.complete(request, 'AST-1', '2026-10-16T00:00:00Z');
  expect(receipt).toMatchObject({
    amountMinor: 12345,
    balanceAfterMinor: 1237655,
    recipient: { name: 'Aisha Rahman' },
  });
  expect((await ledger.account()).balanceMinor).toBe(receipt.balanceAfterMinor);
  expect(await ledger.find(key)).toEqual(receipt);
  expect(await ledger.pending()).toEqual(request);
  await ledger.clearPending(key);
  expect(await ledger.pending()).toBeNull();
});
test('concurrent repeats of one request debit exactly once', async () => {
  const receipts = await Promise.all(
    Array.from({ length: 12 }, () => ledger.complete(request, 'AST-1', '2026-10-16T00:00:00Z')),
  );
  expect(new Set(receipts.map((receipt) => receipt.id)).size).toBe(1);
  expect((await ledger.account()).balanceMinor).toBe(1237655);
  expect((await ledger.history()).items).toHaveLength(1);
});
test('rejects the same key with different details without a second debit', async () => {
  await ledger.complete(request, 'AST-1', '2026-10-16T00:00:00Z');
  await expect(
    ledger.complete({ ...request, draft: { ...request.draft, amountMinor: 1 } }, 'AST-2', ''),
  ).rejects.toMatchObject({ kind: 'conflict' });
  expect((await ledger.account()).balanceMinor).toBe(1237655);
});
test('rechecks funds and never leaves partial balance/history state', async () => {
  await connection.runAsync('UPDATE wallet SET balance = 100');
  await expect(ledger.complete(request, 'AST-1', '')).rejects.toMatchObject({ kind: 'funds' });
  expect((await ledger.account()).balanceMinor).toBe(100);
  expect((await ledger.history()).items).toEqual([]);
});
test('rolls debit back if inserting a receipt fails', async () => {
  await connection.execAsync(
    "CREATE TRIGGER fail_receipt BEFORE INSERT ON transfers BEGIN SELECT RAISE(ABORT, 'disk write failure'); END;",
  );
  await expect(ledger.complete(request, 'AST-1', '')).rejects.toThrow('disk write failure');
  expect((await ledger.account()).balanceMinor).toBe(1250000);
});
test.each([0, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, Infinity])(
  'rejects invalid amount %s at the service boundary',
  async (amountMinor) => {
    await expect(
      ledger.complete({ ...request, draft: { ...request.draft, amountMinor } }, '', ''),
    ).rejects.toMatchObject({ kind: 'invalid' });
  },
);
test('validates recipient identity and prevents overwriting unresolved attempts', async () => {
  await expect(
    ledger.savePending({ ...request, draft: { ...request.draft, recipientId: 'forged' } }),
  ).rejects.toMatchObject({ kind: 'invalid' });
  await ledger.savePending(request);
  await expect(
    ledger.savePending({ ...request, idempotencyKey: '00000000-0000-4000-8000-000000000002' }),
  ).rejects.toMatchObject({ kind: 'conflict' });
  await ledger.clearPending('wrong-key');
  expect(await ledger.pending()).toEqual(request);
});
test('reopening does not reset funds and cursor pages have no duplicate or missing entries', async () => {
  for (let index = 1; index <= 5; index++)
    await ledger.complete(
      { ...request, idempotencyKey: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}` },
      `AST-${index}`,
      '2026-10-16T00:00:00Z',
    );
  await createLedger(connection).initialize();
  expect((await ledger.account()).balanceMinor).toBe(1250000 - 5 * 12345);
  const first = await ledger.history(undefined, 3);
  const second = await ledger.history(first.nextCursor, 3);
  expect([...first.items, ...second.items].map((item) => item.id)).toEqual([
    'AST-5',
    'AST-4',
    'AST-3',
    'AST-2',
    'AST-1',
  ]);
  expect(second.nextCursor).toBeUndefined();
});

test('pages through 1,000 transfers without duplicates while newer activity arrives', async () => {
  for (let index = 1; index <= 1000; index++) {
    await ledger.complete(
      {
        idempotencyKey: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        draft: { ...request.draft, amountMinor: 1 },
      },
      `AST-${index}`,
      '2026-10-17T00:00:00Z',
    );
  }
  let page = await ledger.history();
  const ids = page.items.map((item) => item.id);
  await ledger.complete(
    { ...request, idempotencyKey: '00000000-0000-4000-8000-000000001001' },
    'AST-new',
    '2026-10-17T01:00:00Z',
  );
  while (page.nextCursor !== undefined) {
    page = await ledger.history(page.nextCursor);
    ids.push(...page.items.map((item) => item.id));
  }
  expect(ids).toEqual(Array.from({ length: 1000 }, (_, index) => `AST-${1000 - index}`));
  expect(new Set(ids).size).toBe(1000);
  expect((await ledger.history()).items[0].id).toBe('AST-new');
  expect((await ledger.account()).balanceMinor).toBe(1250000 - 1000 - request.draft.amountMinor);
});
