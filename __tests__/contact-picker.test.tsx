import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { ContactPicker } from '../src/features/contacts/components/ContactPicker';
import { contactPermission, loadContacts } from '../src/features/contacts/services/deviceContacts';
import { theme } from '../src/theme/paperTheme';

jest.mock('../src/features/contacts/services/deviceContacts', () => ({
  contactPermission: jest.fn(),
  loadContacts: jest.fn(),
  requestContactPermission: jest.fn(),
  manageLimitedContacts: jest.fn(),
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => ({
  __esModule: true,
  default: jest.requireActual('react-native').Text,
}));
const permission = jest.mocked(contactPermission);
const contacts = jest.mocked(loadContacts);
async function openPicker(onSelect = jest.fn(), onClose = jest.fn()) {
  await render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <PaperProvider theme={theme}>
        <ContactPicker onSelect={onSelect} onClose={onClose} />
      </PaperProvider>
    </QueryClientProvider>,
  );
  return { onSelect, onClose };
}
beforeEach(() => {
  permission.mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
    accessPrivileges: 'all',
  } as Awaited<ReturnType<typeof contactPermission>>);
  contacts.mockResolvedValue({ rows: [], nextOffset: undefined });
});
test('denied access has a manual alternative and never reads contacts', async () => {
  permission.mockResolvedValue({
    status: 'denied',
    granted: false,
    canAskAgain: false,
    expires: 'never',
    accessPrivileges: 'none',
  } as Awaited<ReturnType<typeof contactPermission>>);
  const { onClose } = await openPicker();
  expect(await screen.findByText('Contacts access is off')).toBeOnTheScreen();
  expect(screen.getByText('Open settings')).toBeOnTheScreen();
  expect(contacts).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Use saved recipients'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
test('limited access and empty contacts are explained', async () => {
  permission.mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
    accessPrivileges: 'limited',
  } as Awaited<ReturnType<typeof contactPermission>>);
  await openPicker();
  expect(await screen.findByText('Only contacts you allowed are shown.')).toBeOnTheScreen();
  expect(await screen.findByText('No contacts available')).toBeOnTheScreen();
});
test('choosing a registered phone resolves its payee ID, while an unknown number explains why it cannot send', async () => {
  contacts.mockResolvedValue({
    rows: [
      { key: '1', name: 'Contact alias', phone: '+12025550101', recipientId: 'aisha' },
      { key: '2', name: 'Unknown', phone: '+12025550199' },
    ],
    nextOffset: undefined,
  });
  const { onSelect } = await openPicker();
  await screen.findByText('Contact alias');
  await fireEvent.press(screen.getByRole('button', { name: 'Unknown, +12025550199' }));
  expect(screen.getByText(/isn’t registered/)).toBeOnTheScreen();
  expect(onSelect).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Contact alias, +12025550101' }));
  expect(onSelect).toHaveBeenCalledWith('aisha');
});
test('a native read error offers retry instead of pretending the address book is empty', async () => {
  contacts.mockRejectedValue(new Error('Native unavailable'));
  await openPicker();
  expect(await screen.findByText('Couldn’t load your contacts.')).toBeOnTheScreen();
  expect(screen.getByText('Try again')).toBeOnTheScreen();
});
