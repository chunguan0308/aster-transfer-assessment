import * as Network from 'expo-network';
import {
  getLedger,
  recoverPending,
  submitTransfer,
} from '../src/features/transfers/services/transferApi';
import { recipients } from '../src/features/transfers/constants/demoData';

jest.mock('expo-network', () => ({ getNetworkStateAsync: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000002' }));
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: async () => ({ closeAsync: jest.fn() }) }));
jest.mock('../src/features/transfers/services/ledger', () => ({ createLedger: () => mockLedger }));
const mockLedger = {
  initialize: jest.fn(),
  complete: jest.fn(),
  pending: jest.fn(),
  find: jest.fn(),
  clearPending: jest.fn(),
};
const attempt = {
  idempotencyKey: '00000000-0000-4000-8000-000000000001',
  draft: { recipientId: 'aisha', amountMinor: 1234, note: '' },
};
const receipt = {
  ...attempt.draft,
  id: 'AST-1',
  idempotencyKey: attempt.idempotencyKey,
  recipient: recipients[0],
  createdAt: '2026-10-16T00:00:00Z',
  balanceAfterMinor: 1248766,
  status: 'completed' as const,
};
beforeEach(() => {
  jest.useFakeTimers();
  jest
    .mocked(Network.getNetworkStateAsync)
    .mockResolvedValue({ isConnected: true, isInternetReachable: true } as Awaited<
      ReturnType<typeof Network.getNetworkStateAsync>
    >);
  mockLedger.initialize.mockResolvedValue(undefined);
  mockLedger.complete.mockResolvedValue(receipt);
  mockLedger.pending.mockResolvedValue(null);
  mockLedger.clearPending.mockResolvedValue(undefined);
});
afterEach(() => jest.useRealTimers());
test('normal processing returns the committed receipt', async () => {
  const result = submitTransfer(attempt, 'normal');
  const assertion = expect(result).resolves.toEqual(receipt);
  await jest.runAllTimersAsync();
  await assertion;
  expect(mockLedger.complete).toHaveBeenCalledTimes(1);
});
test.each([
  ['offline', 'network'],
  ['insufficient', 'funds'],
] as const)('%s rejects before the debit boundary', async (scenario, kind) => {
  const assertion = expect(submitTransfer(attempt, scenario)).rejects.toMatchObject({ kind });
  await jest.runAllTimersAsync();
  await assertion;
  expect(mockLedger.complete).not.toHaveBeenCalled();
});
test('native network-check failure explains that no transfer was sent', async () => {
  jest.mocked(Network.getNetworkStateAsync).mockRejectedValue(new Error('Native unavailable'));
  await expect(submitTransfer(attempt, 'normal')).rejects.toMatchObject({ kind: 'network' });
  expect(mockLedger.complete).not.toHaveBeenCalled();
});
test('a lost response is uncertain after exactly one commit, then restart recovery reads its reference', async () => {
  const assertion = expect(submitTransfer(attempt, 'response-lost')).rejects.toMatchObject({
    kind: 'uncertain',
  });
  await jest.runAllTimersAsync();
  await assertion;
  expect(mockLedger.complete).toHaveBeenCalledTimes(1);
  mockLedger.pending.mockResolvedValue(attempt);
  mockLedger.find.mockResolvedValue(receipt);
  await expect(recoverPending()).resolves.toEqual(receipt);
  expect(mockLedger.find).toHaveBeenCalledWith(attempt.idempotencyKey);
  expect(mockLedger.clearPending).toHaveBeenCalledWith(attempt.idempotencyKey);
  expect(mockLedger.complete).toHaveBeenCalledTimes(1);
});
test('restart recovery clears a rolled-back local attempt without re-submitting', async () => {
  mockLedger.pending.mockResolvedValue(attempt);
  mockLedger.find.mockResolvedValue(null);
  await expect(recoverPending()).resolves.toBeNull();
  expect(mockLedger.complete).not.toHaveBeenCalled();
  expect(await getLedger()).toBe(mockLedger);
});
