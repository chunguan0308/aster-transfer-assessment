import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { authorizeTransfer, AuthenticationError } from '../src/features/auth/authorize';
import { getLedger, submitTransfer } from '../src/features/transfers/api';
import { TransferError } from '../src/features/transfers/errors';
import { recipients } from '../src/features/transfers/fixtures';
import { useTransfer } from '../src/features/transfers/useTransfer';

jest.mock('../src/features/auth/authorize', () => ({
  ...jest.requireActual('../src/features/auth/authorize'),
  authorizeTransfer: jest.fn(),
}));
jest.mock('../src/features/transfers/api', () => ({
  getLedger: jest.fn(),
  submitTransfer: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000001' }));
const draft = { recipientId: 'aisha', amountMinor: 12345, note: 'Lunch' };
const receipt = {
  ...draft,
  id: 'AST-1',
  idempotencyKey: '00000000-0000-4000-8000-000000000001',
  recipient: recipients[0],
  createdAt: '2026-10-16T00:00:00Z',
  balanceAfterMinor: 1237655,
  status: 'completed' as const,
};
const mockLedger = { savePending: jest.fn(), clearPending: jest.fn(), find: jest.fn() };
const authenticate = jest.mocked(authorizeTransfer);
const submit = jest.mocked(submitTransfer);
function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false, gcTime: Infinity },
            mutations: { gcTime: Infinity },
          },
        })
      }
    >
      {children}
    </QueryClientProvider>
  );
}
beforeEach(() => {
  AppState.currentState = 'active';
  jest
    .mocked(getLedger)
    .mockResolvedValue(mockLedger as unknown as Awaited<ReturnType<typeof getLedger>>);
  authenticate.mockResolvedValue(undefined);
  mockLedger.savePending.mockResolvedValue(undefined);
  mockLedger.clearPending.mockResolvedValue(undefined);
  mockLedger.find.mockResolvedValue(receipt);
  submit.mockResolvedValue(receipt);
});

test('quick repeated taps authenticate and debit once, for an immutable reviewed snapshot', async () => {
  let authorize!: () => void;
  authenticate.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        authorize = resolve;
      }),
  );
  const { result } = await renderHook(() => useTransfer(), { wrapper });
  const editable = { ...draft };
  await act(async () => {
    result.current.send(editable, recipients[0], 'normal');
    result.current.send(editable, recipients[0], 'normal');
  });
  editable.amountMinor = 1;
  expect(authenticate).toHaveBeenCalledTimes(1);
  expect(submit).not.toHaveBeenCalled();
  await act(async () => {
    authorize();
  });
  await waitFor(() => expect(result.current.receipt).toEqual(receipt));
  expect(submit).toHaveBeenCalledTimes(1);
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ draft }), 'normal');
});
test('cancelled authorization never saves an attempt or calls the API', async () => {
  authenticate.mockRejectedValue(new AuthenticationError('cancelled', 'Cancelled'));
  const { result } = await renderHook(() => useTransfer(), { wrapper });
  await act(async () => {
    result.current.send(draft, recipients[0], 'normal');
  });
  await waitFor(() => expect(result.current.error).toBeInstanceOf(AuthenticationError));
  expect(mockLedger.savePending).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
test('an authorization callback after unmount cannot initiate a transfer', async () => {
  let authorize!: () => void;
  authenticate.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        authorize = resolve;
      }),
  );
  const { result, unmount } = await renderHook(() => useTransfer(), { wrapper });
  await act(async () => {
    result.current.send(draft, recipients[0], 'normal');
  });
  await unmount();
  await act(async () => {
    authorize();
  });
  expect(mockLedger.savePending).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
test('does not send when the app is backgrounded after authorization', async () => {
  AppState.currentState = 'background';
  const { result } = await renderHook(() => useTransfer(), { wrapper });
  await act(async () => {
    result.current.send(draft, recipients[0], 'normal');
  });
  await waitFor(() => expect(result.current.error).toBeInstanceOf(AuthenticationError));
  expect(submit).not.toHaveBeenCalled();
});
test('a lost response permits a read-only status check, without reauth or a second submission', async () => {
  submit.mockRejectedValueOnce(new TransferError('uncertain', 'Response lost'));
  const { result } = await renderHook(() => useTransfer(), { wrapper });
  await act(async () => {
    result.current.send(draft, recipients[0], 'response-lost');
  });
  await waitFor(() => expect(result.current.unresolved).toBe(true));
  expect(mockLedger.clearPending).not.toHaveBeenCalled();
  await act(async () => {
    result.current.send(draft, recipients[0], 'normal');
  });
  await waitFor(() => expect(result.current.receipt).toEqual(receipt));
  expect(authenticate).toHaveBeenCalledTimes(1);
  expect(submit).toHaveBeenCalledTimes(1);
  expect(mockLedger.find).toHaveBeenCalledWith(receipt.idempotencyKey);
});
test('a known network rejection allows a new attempt only with fresh authentication', async () => {
  submit.mockRejectedValueOnce(new TransferError('network', 'Offline'));
  const { result } = await renderHook(() => useTransfer(), { wrapper });
  await act(async () => {
    result.current.send(draft, recipients[0], 'offline');
  });
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(result.current.unresolved).toBe(false);
  await act(async () => {
    result.current.send(draft, recipients[0], 'normal');
  });
  await waitFor(() => expect(result.current.receipt).toEqual(receipt));
  expect(authenticate).toHaveBeenCalledTimes(2);
});
test('a cleanup/storage failure preserves reconciliation and cannot silently enable a resend', async () => {
  mockLedger.clearPending.mockRejectedValue(new Error('Storage unavailable'));
  const { result } = await renderHook(() => useTransfer(), { wrapper });
  await act(async () => {
    result.current.send(draft, recipients[0], 'normal');
  });
  await waitFor(() => expect(result.current.unresolved).toBe(true));
  expect(result.current.receipt).toBeUndefined();
  expect(result.current.error?.message).toMatch(/Check the transfer status/);
});
