import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { HistoryModal } from '..';
import { recipients } from '@/features/transfers/constants/demoData';
import { getLedger } from '@/features/transfers/services/transferApi';
import { theme } from '@/theme/paperTheme';

jest.mock('@/features/transfers/services/transferApi', () => ({ getLedger: jest.fn() }));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => ({
  __esModule: true,
  default: jest.requireActual('react-native').Text,
}));
const receipt = {
  recipientId: 'aisha',
  amountMinor: 12345,
  note: 'Lunch',
  id: 'AST-1',
  idempotencyKey: '00000000-0000-4000-8000-000000000001',
  recipient: recipients[0],
  createdAt: '2026-10-16T00:00:00Z',
  balanceAfterMinor: 1237655,
  status: 'completed' as const,
};
const history = jest.fn();
async function openHistory() {
  jest
    .mocked(getLedger)
    .mockResolvedValue({ history } as unknown as Awaited<ReturnType<typeof getLedger>>);
  const onRepeat = jest.fn();
  const onClose = jest.fn();
  await render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      <PaperProvider theme={theme}>
        <HistoryModal onClose={onClose} onRepeat={onRepeat} />
      </PaperProvider>
    </QueryClientProvider>,
  );
  return { onRepeat, onClose };
}
test('shows completed history, receipt details and repeat action without submitting a payment', async () => {
  history.mockResolvedValue({ items: [receipt] });
  const { onRepeat } = await openHistory();
  await fireEvent.press(await screen.findByRole('button', { name: /Aisha Rahman, sent/ }));
  expect(screen.getByText('AST-1')).toBeOnTheScreen();
  expect(screen.getByText('Lunch')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Send again'));
  expect(onRepeat).toHaveBeenCalledWith(receipt);
});
test('distinguishes empty history from a storage error', async () => {
  history.mockResolvedValue({ items: [] });
  await openHistory();
  expect(await screen.findByText('Your first transfer starts here.')).toBeOnTheScreen();
});
test('offers retry on a history read error', async () => {
  history.mockRejectedValue(new Error('Read failed'));
  await openHistory();
  expect(await screen.findByText('Couldn’t load activity.')).toBeOnTheScreen();
  expect(screen.getByText('Try again')).toBeOnTheScreen();
});
