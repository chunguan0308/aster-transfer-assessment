import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert, AppState, Linking } from 'react-native';
import { authorizeTransfer, AuthenticationError } from '@/features/auth/services/authorize';
import {
  initialAccount as mockInitialAccount,
  recipients,
} from '@/features/transfers/constants/demoData';
import { PaperProvider } from 'react-native-paper';
import HomeScreen from '@/features/transfers/screens/TransferScreen';
import { theme } from '@/theme/paperTheme';
jest.mock('@/features/contacts/services/deviceContacts', () => ({
  contactPermission: jest.fn(),
  loadContacts: jest.fn(),
  requestContactPermission: jest.fn(),
}));

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => ({
  __esModule: true,
  default: jest.requireActual('react-native').Text,
}));
jest.mock('@/features/transfers/services/transferApi', () => ({
  getLedger: async () => ({
    account: async () => mockInitialAccount,
    history: async () => ({ items: [mockReceipt] }),
    savePending: async () => undefined,
    clearPending: async () => undefined,
  }),
  submitTransfer: async () => mockReceipt,
  recoverPending: async () => null,
}));

jest.mock('@/features/auth/services/authorize', () => ({
  ...jest.requireActual('@/features/auth/services/authorize'),
  authorizeTransfer: jest.fn(async () => undefined),
}));
const mockReceipt = {
  recipientId: 'aisha',
  amountMinor: 12345,
  note: 'Dinner',
  id: 'AST-1',
  idempotencyKey: '00000000-0000-4000-8000-000000000001',
  recipient: recipients[0],
  createdAt: '2026-10-16T00:00:00Z',
  balanceAfterMinor: 1237655,
  status: 'completed' as const,
};

test('validates the form, reviews exact details, and restores values when editing', async () => {
  await render(
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
      <PaperProvider theme={theme}>
        <HomeScreen />
      </PaperProvider>
    </QueryClientProvider>,
  );
  expect(await screen.findByRole('header', { name: 'aster' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Review transfer'));
  expect(await screen.findByText('Choose a recipient to continue.')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('radio', { name: 'Aisha Rahman' }));
  await fireEvent.changeText(screen.getByLabelText('Amount in Malaysian ringgit'), '123.45');
  await fireEvent.changeText(screen.getByLabelText('Note (optional)'), 'Dinner');
  await fireEvent.press(screen.getByText('Review transfer'));
  expect(screen.getByText('One last look.')).toBeOnTheScreen();
  expect(screen.getByText(/123.45/)).toBeOnTheScreen();
  expect(screen.getByText('Dinner')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Edit details'));
  expect(screen.getByLabelText('Amount in Malaysian ringgit')).toHaveDisplayValue('123.45');
});

test('history resend prefills an editable form and requires new authorization', async () => {
  AppState.currentState = 'active';
  await render(
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
      <PaperProvider theme={theme}>
        <HomeScreen />
      </PaperProvider>
    </QueryClientProvider>,
  );
  await fireEvent.press(await screen.findByText('View activity'));
  await fireEvent.press(await screen.findByRole('button', { name: /Aisha Rahman, sent/ }));
  await fireEvent.press(screen.getByText('Send again'));
  expect(screen.getByLabelText('Amount in Malaysian ringgit')).toHaveDisplayValue('123.45');
  expect(screen.getByLabelText('Note (optional)')).toHaveDisplayValue('Dinner');
  expect(authorizeTransfer).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Review transfer'));
  await fireEvent.press(screen.getByText('Authorize & send'));
  expect(await screen.findByText('Money sent.')).toBeOnTheScreen();
  expect(authorizeTransfer).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText('Done'));
  await fireEvent.press(screen.getByText('View activity'));
  await fireEvent.press(await screen.findByRole('button', { name: /Aisha Rahman, sent/ }));
  await fireEvent.press(screen.getByText('Send again'));
  await fireEvent.press(screen.getByText('Review transfer'));
  await fireEvent.press(screen.getByText('Authorize & send'));
  expect(await screen.findByText('Money sent.')).toBeOnTheScreen();
  expect(authorizeTransfer).toHaveBeenCalledTimes(2);
});

test('an unavailable Settings link gives manual setup guidance without sending', async () => {
  jest
    .mocked(authorizeTransfer)
    .mockRejectedValueOnce(new AuthenticationError('setup', 'Set up a screen lock.'));
  const open = jest
    .spyOn(Linking, 'openSettings')
    .mockRejectedValueOnce(new Error('No settings handler'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await render(
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
      <PaperProvider theme={theme}>
        <HomeScreen />
      </PaperProvider>
    </QueryClientProvider>,
  );
  await fireEvent.press(await screen.findByRole('radio', { name: 'Aisha Rahman' }));
  await fireEvent.changeText(screen.getByLabelText('Amount in Malaysian ringgit'), '1');
  await fireEvent.press(screen.getByText('Review transfer'));
  await fireEvent.press(screen.getByText('Authorize & send'));
  await fireEvent.press(await screen.findByText('Open device settings'));
  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith(
      'Open Settings manually',
      'Set up a screen lock or biometrics in your device Settings, then return to Aster.',
    ),
  );
  expect(screen.queryByText('Money sent.')).not.toBeOnTheScreen();
  open.mockRestore();
  alert.mockRestore();
});
