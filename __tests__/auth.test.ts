import * as LocalAuthentication from 'expo-local-authentication';
import { authenticationError, authorizeTransfer } from '../src/features/auth/services/authorize';
import { recipients } from '../src/features/transfers/constants/demoData';

jest.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));
const level = jest.mocked(LocalAuthentication.getEnrolledLevelAsync);
const authenticate = jest.mocked(LocalAuthentication.authenticateAsync);
const draft = { recipientId: 'aisha', amountMinor: 12345, note: 'Lunch' };

beforeEach(() => {
  level.mockResolvedValue(3);
  authenticate.mockResolvedValue({ success: true });
});

test('uses strong native authentication for the exact reviewed amount and recipient', async () => {
  await expect(authorizeTransfer(draft, recipients[0])).resolves.toBeUndefined();
  expect(authenticate).toHaveBeenCalledWith(
    expect.objectContaining({
      promptMessage: expect.stringMatching(/123.45/),
      promptSubtitle: 'To Aisha Rahman',
      biometricsSecurityLevel: 'strong',
      disableDeviceFallback: false,
      requireConfirmation: true,
    }),
  );
});
test('allows OS credential fallback when no biometrics are enrolled', async () => {
  level.mockResolvedValue(1);
  await expect(authorizeTransfer(draft, recipients[0])).resolves.toBeUndefined();
  expect(authenticate).toHaveBeenCalledTimes(1);
});
test('blocks a device with no authentication configured', async () => {
  level.mockResolvedValue(0);
  await expect(authorizeTransfer(draft, recipients[0])).rejects.toMatchObject({ kind: 'setup' });
  expect(authenticate).not.toHaveBeenCalled();
});
test.each(['user_cancel', 'system_cancel', 'app_cancel'] as const)(
  'never authorizes after %s',
  async (error) => {
    authenticate.mockResolvedValue({ success: false, error });
    await expect(authorizeTransfer(draft, recipients[0])).rejects.toMatchObject({
      kind: 'cancelled',
    });
  },
);
test.each(['lockout', 'timeout', 'authentication_failed', 'unknown'] as const)(
  'explains %s without granting authorization',
  async (error) => {
    authenticate.mockResolvedValue({ success: false, error });
    await expect(authorizeTransfer(draft, recipients[0])).rejects.toMatchObject({ kind: 'retry' });
  },
);
test('contains a native exception and distinguishes missing device credentials', async () => {
  level.mockRejectedValue(new Error('Native detail'));
  await expect(authorizeTransfer(draft, recipients[0])).rejects.toThrow(
    'Device authorization is unavailable',
  );
  expect(authenticationError('passcode_not_set').kind).toBe('setup');
});
