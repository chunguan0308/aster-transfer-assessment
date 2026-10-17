import * as LocalAuthentication from 'expo-local-authentication';
import { formatMoney } from '@/features/transfers/domain/money';
import type { Recipient, TransferDraft } from '@/features/transfers/domain/types';

export class AuthenticationError extends Error {
  constructor(
    public readonly kind: 'cancelled' | 'setup' | 'retry',
    message: string,
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export function authenticationError(code: string): AuthenticationError {
  switch (code) {
    case 'user_cancel':
    case 'app_cancel':
    case 'system_cancel':
      return new AuthenticationError('cancelled', 'Authorization cancelled. No money was sent.');
    case 'not_enrolled':
    case 'passcode_not_set':
    case 'not_available':
      return new AuthenticationError(
        'setup',
        'Set up a device screen lock or biometrics in Settings, then try again.',
      );
    case 'lockout':
      return new AuthenticationError(
        'retry',
        'Biometrics are locked. Unlock your device with its passcode, then try again.',
      );
    case 'timeout':
      return new AuthenticationError(
        'retry',
        'Authorization timed out. Try again when you’re ready.',
      );
    case 'authentication_failed':
      return new AuthenticationError(
        'retry',
        'Your identity wasn’t confirmed. Try again or use your device passcode.',
      );
    default:
      return new AuthenticationError(
        'retry',
        'Device authorization is unavailable right now. No money was sent. Try again.',
      );
  }
}

/** OS credentials are the only fallback; this grants no reusable app session. */
export async function authorizeTransfer(draft: TransferDraft, recipient: Recipient): Promise<void> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    if (level === LocalAuthentication.SecurityLevel.NONE) throw authenticationError('not_enrolled');
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Send ${formatMoney(draft.amountMinor)}`,
      promptSubtitle: `To ${recipient.name}`,
      promptDescription: `${recipient.bankName} · ${recipient.accountNumber}`,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use device passcode',
      disableDeviceFallback: false,
      biometricsSecurityLevel: 'strong',
      requireConfirmation: true,
    });
    if (!result.success) throw authenticationError(result.error);
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw authenticationError('unknown');
  }
}
