import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Linking } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ContactPicker } from '..';
import { contactPermission, loadContacts } from '@/features/contacts/services/deviceContacts';
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
  jest.useFakeTimers();
  permission.mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
    accessPrivileges: 'all',
  } as Awaited<ReturnType<typeof contactPermission>>);
  contacts.mockResolvedValue({ rows: [], nextOffset: undefined });
});
afterEach(async () => {
  await act(async () => jest.runOnlyPendingTimers());
  jest.useRealTimers();
  jest.restoreAllMocks();
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
  await fireEvent(screen.getByTestId('device-contacts'), 'refresh');
  await waitFor(() => expect(permission).toHaveBeenCalledTimes(2));
  expect(contacts).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Use saved recipients'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
test('limited access and empty contacts are explained', async () => {
  const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  const appState = jest.spyOn(AppState, 'addEventListener');
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
  await fireEvent.press(screen.getByText('Manage allowed contacts'));
  expect(openSettings).toHaveBeenCalledTimes(1);
  contacts.mockResolvedValue({
    rows: [{ key: '1', name: 'Newly allowed', phone: '+12025550101', recipientId: 'aisha' }],
    nextOffset: undefined,
  });
  const onState = appState.mock.calls.find(([event]) => event === 'change')![1];
  await act(async () => onState('active'));
  expect(await screen.findByText('Newly allowed')).toBeOnTheScreen();
  expect(screen.getByText('Your contacts')).toBeOnTheScreen();
});
test('an unavailable Settings link gives manual contacts guidance', async () => {
  const openSettings = jest
    .spyOn(Linking, 'openSettings')
    .mockRejectedValue(new Error('Unavailable'));
  permission.mockResolvedValue({
    status: 'denied',
    granted: false,
    canAskAgain: false,
    expires: 'never',
    accessPrivileges: 'none',
  } as Awaited<ReturnType<typeof contactPermission>>);
  await openPicker();
  await fireEvent.press(await screen.findByText('Open settings'));
  await waitFor(() => expect(openSettings).toHaveBeenCalledTimes(1));
  expect(
    await screen.findByText('Open your device Settings to manage contacts access.'),
  ).toBeOnTheScreen();
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

test('returning after revocation checks permission before any contact refresh and removes page retry', async () => {
  const appState = jest.spyOn(AppState, 'addEventListener');
  contacts
    .mockResolvedValueOnce({
      rows: [{ key: '1', name: 'Allowed before', phone: '+12025550101', recipientId: 'aisha' }],
      nextOffset: 50,
    })
    .mockRejectedValue(new Error('Page failed'));
  await openPicker();
  await screen.findByText('Allowed before');
  await fireEvent(screen.getByTestId('device-contacts'), 'endReached', { distanceFromEnd: 0 });
  await screen.findByText('Retry loading more');
  const readsBeforeReturn = contacts.mock.calls.length;
  let resolvePermission!: (value: Awaited<ReturnType<typeof contactPermission>>) => void;
  permission.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolvePermission = resolve;
      }),
  );
  const onState = appState.mock.calls.find(([event]) => event === 'change')![1];
  await act(async () => onState('active'));
  expect(contacts).toHaveBeenCalledTimes(readsBeforeReturn);
  await act(async () =>
    resolvePermission({
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never',
      accessPrivileges: 'none',
    } as Awaited<ReturnType<typeof contactPermission>>),
  );
  await screen.findByText('Contacts access is off');
  expect(contacts).toHaveBeenCalledTimes(readsBeforeReturn);
  expect(screen.queryByText('Retry loading more')).not.toBeOnTheScreen();
});
