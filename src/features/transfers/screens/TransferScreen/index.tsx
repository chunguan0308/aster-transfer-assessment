import { styles } from './index.styles';
import { useState } from 'react';
import { DemoSettings } from '@/features/transfers/components/DemoSettings';
import { simulationOptions, type Simulation } from '@/features/transfers/constants/simulation';
import { HistoryModal } from '@/features/transfers/components/HistoryModal';
import { Linking, View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { recipients } from '@/features/transfers/constants/demoData';
import { formatMoney, amountInput } from '@/features/transfers/domain/money';
import { ReviewTransfer } from '@/features/transfers/components/ReviewTransfer';
import { TransferForm } from '@/features/transfers/components/TransferForm';
import type { TransferDraft } from '@/features/transfers/domain/types';
import { colors } from '@/theme/tokens';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from './hooks/useAccount';
import { queryKeys } from '@/features/transfers/constants/queryKeys';
import { useTransfer } from './hooks/useTransfer';
import { TransferReceiptView } from '@/features/transfers/components/TransferReceiptView';
import { AuthenticationError } from '@/features/auth/services/authorize';

export default function TransferScreen() {
  const client = useQueryClient();
  const { account, recovery } = useAccount();
  const transfer = useTransfer();
  const [draft, setDraft] = useState<TransferDraft>();
  const [reviewing, setReviewing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [simulation, setSimulation] = useState<Simulation>('normal');
  const [formVersion, setFormVersion] = useState(0);
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
    <Screen scrollKey={receipt?.id ?? (reviewing ? 'review' : `form-${formVersion}`)}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Icon source="asterisk" color={colors.primary} size={30} />
          <Text variant="headlineMedium" style={styles.brandText} accessibilityRole="header">
            aster
          </Text>
        </View>
        <Button
          compact
          icon="flask-outline"
          accessibilityLabel="Demo settings"
          disabled={reviewing || !!receipt || transfer.busy}
          onPress={() => setDemoOpen(true)}
        >
          Demo
        </Button>
      </View>
      {receipt ? (
        <TransferReceiptView
          receipt={receipt}
          onDone={() => {
            transfer.reset();
            client.setQueryData(queryKeys.recovery, null);
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
            <Text accessibilityRole="alert" style={styles.error}>
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
            contentStyle={styles.action}
            onPress={() => transfer.send(draft, recipient, simulation)}
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
              <Icon source="shield-check-outline" color={colors.onDarkAccent} size={22} />
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
          {simulation !== 'normal' && (
            <Text style={styles.caption}>
              Demo scenario:{' '}
              {simulationOptions.find((option) => option.value === simulation)?.title}
            </Text>
          )}
          <Button icon="history" onPress={() => setHistoryOpen(true)}>
            View activity
          </Button>
          <TransferForm
            key={formVersion}
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
      <DemoSettings
        visible={demoOpen}
        value={simulation}
        onChange={setSimulation}
        onClose={() => setDemoOpen(false)}
      />
      {historyOpen && (
        <HistoryModal
          onClose={() => setHistoryOpen(false)}
          onRepeat={(previous) => {
            transfer.reset();
            setDraft({
              recipientId: previous.recipientId,
              amountMinor: previous.amountMinor,
              note: previous.note,
            });
            setReviewing(false);
            setFormVersion((version) => version + 1);
            setHistoryOpen(false);
          }}
        />
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
