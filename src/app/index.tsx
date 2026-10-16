import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';
import { Screen } from '../components/Screen';
import { recipients } from '../features/transfers/fixtures';
import { formatMoney, amountInput } from '../features/transfers/money';
import { ReviewTransfer } from '../features/transfers/ReviewTransfer';
import { TransferForm } from '../features/transfers/TransferForm';
import type { TransferDraft } from '../features/transfers/types';
import { colors } from '../theme';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLedger, recoverPending } from '../features/transfers/api';
import { useTransfer } from '../features/transfers/useTransfer';
import { TransferReceiptView } from '../features/transfers/TransferReceiptView';
import { AuthenticationError } from '../features/auth/authorize';

export default function HomeScreen() {
  const client = useQueryClient();
  const account = useQuery({
    queryKey: ['account'],
    queryFn: async () => (await getLedger()).account(),
  });
  const recovery = useQuery({
    queryKey: ['recovery'],
    queryFn: recoverPending,
    staleTime: Infinity,
  });
  const transfer = useTransfer();
  const [draft, setDraft] = useState<TransferDraft>();
  const [reviewing, setReviewing] = useState(false);
  const recipient = recipients.find((item) => item.id === draft?.recipientId);
  const receipt = transfer.receipt ?? recovery.data;
  if (account.isPending || recovery.isPending)
    return (
      <Screen>
        <ActivityIndicator accessibilityLabel="Loading your account" />
        <Text>Getting things ready…</Text>
      </Screen>
    );
  if (account.isError || recovery.isError || !account.data)
    return (
      <Screen>
        <Text variant="headlineSmall" accessibilityRole="header">
          We couldn’t open your account.
        </Text>
        <Text>Your saved data hasn’t been reset. Please try again.</Text>
        <Button
          onPress={() => {
            void account.refetch();
            void recovery.refetch();
          }}
        >
          Try again
        </Button>
      </Screen>
    );
  const currentAccount = account.data;
  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Icon source="asterisk" color={colors.primary} size={30} />
          <Text variant="headlineMedium" style={styles.brandText} accessibilityRole="header">
            aster
          </Text>
        </View>
        <View style={styles.badge}>
          <Text variant="labelSmall">DEMO ACCOUNT</Text>
        </View>
      </View>
      {receipt ? (
        <TransferReceiptView
          receipt={receipt}
          onDone={() => {
            transfer.reset();
            client.setQueryData(['recovery'], null);
            setDraft(undefined);
            setReviewing(false);
          }}
        />
      ) : reviewing && draft && recipient ? (
        <ReviewTransfer
          draft={draft}
          recipient={recipient}
          busy={transfer.busy || transfer.unresolved}
          onEdit={() => {
            transfer.reset();
            setReviewing(false);
          }}
        >
          {transfer.error && (
            <Text accessibilityRole="alert" style={{ color: colors.ink }}>
              {transfer.error.message}
            </Text>
          )}
          {transfer.error instanceof AuthenticationError && transfer.error.kind === 'setup' && (
            <Button
              onPress={() => {
                void Linking.openSettings();
              }}
            >
              Open device settings
            </Button>
          )}
          <Button
            icon="fingerprint"
            mode="contained"
            loading={transfer.busy}
            disabled={transfer.busy}
            contentStyle={{ minHeight: 54 }}
            onPress={() => transfer.send(draft, recipient, 'normal')}
          >
            {transfer.busy
              ? transfer.phase === 'authorizing'
                ? 'Waiting for authorization…'
                : transfer.phase === 'checking'
                  ? 'Checking status…'
                  : 'Sending securely…'
              : transfer.unresolved
                ? 'Check transfer status'
                : 'Authorize & send'}
          </Button>
          <Text variant="bodySmall">Confirm with biometrics or your device passcode.</Text>
        </ReviewTransfer>
      ) : (
        <>
          <View style={styles.balance}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel} variant="labelLarge">
                {currentAccount.name}
              </Text>
              <Icon source="shield-check-outline" color="#A2D8BE" size={22} />
            </View>
            <Text
              style={styles.balanceValue}
              variant="displaySmall"
              accessibilityLabel={`Available balance ${formatMoney(currentAccount.balanceMinor)}`}
            >
              {formatMoney(currentAccount.balanceMinor)}
            </Text>
            <Text style={styles.balanceLabel} variant="bodySmall">
              Available balance · •••• {currentAccount.accountNumber.slice(-4)}
            </Text>
          </View>
          <TransferForm
            account={currentAccount}
            initialValues={
              draft
                ? {
                    recipientId: draft.recipientId,
                    amount: amountInput(draft.amountMinor),
                    note: draft.note,
                  }
                : undefined
            }
            onReview={(value) => {
              setDraft(value);
              setReviewing(true);
            }}
          />
        </>
      )}
      <View style={styles.bottom}>
        <Icon source="lock-outline" color={colors.muted} size={16} />
        <Text variant="bodySmall" style={styles.caption}>
          Simulated transfers. No real money moves.
        </Text>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brandText: { fontWeight: '800', letterSpacing: -1, color: colors.ink },
  badge: { backgroundColor: '#E7EEE9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  balance: { borderRadius: 24, backgroundColor: colors.ink, padding: 24, gap: 16 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: '#C5D8D1' },
  balanceValue: { color: '#FFFFFF', fontWeight: '600', letterSpacing: -1 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto',
  },
  caption: { color: colors.muted, flexShrink: 1 },
});
