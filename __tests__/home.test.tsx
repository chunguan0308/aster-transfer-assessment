import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initialAccount as mockInitialAccount } from '../src/features/transfers/fixtures';
import { PaperProvider } from 'react-native-paper';
import HomeScreen from '../src/app/index';
import { theme } from '../src/theme';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => ({
  __esModule: true,
  default: jest.requireActual('react-native').Text,
}));
jest.mock('../src/features/transfers/api', () => ({
  getLedger: async () => ({ account: async () => mockInitialAccount }),
  recoverPending: async () => null,
}));

test('validates the form, reviews exact details, and restores values when editing', async () => {
  await render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
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
