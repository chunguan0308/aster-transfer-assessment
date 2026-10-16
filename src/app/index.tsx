import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Screen } from '../components/Screen';
import { initialAccount, recipients } from '../features/transfers/fixtures';
import { formatMoney, amountInput } from '../features/transfers/money';
import { ReviewTransfer } from '../features/transfers/ReviewTransfer';
import { TransferForm } from '../features/transfers/TransferForm';
import type { TransferDraft } from '../features/transfers/types';
import { colors } from '../theme';

export default function HomeScreen() {
  const [draft, setDraft] = useState<TransferDraft>();
  const [reviewing, setReviewing] = useState(false);
  const recipient = recipients.find((item) => item.id === draft?.recipientId);
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
      {reviewing && draft && recipient ? (
        <ReviewTransfer draft={draft} recipient={recipient} onEdit={() => setReviewing(false)} />
      ) : (
        <>
          <View style={styles.balance}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel} variant="labelLarge">
                {initialAccount.name}
              </Text>
              <Icon source="shield-check-outline" color="#A2D8BE" size={22} />
            </View>
            <Text
              style={styles.balanceValue}
              variant="displaySmall"
              accessibilityLabel={`Available balance ${formatMoney(initialAccount.balanceMinor)}`}
            >
              {formatMoney(initialAccount.balanceMinor)}
            </Text>
            <Text style={styles.balanceLabel} variant="bodySmall">
              Available balance · •••• {initialAccount.accountNumber.slice(-4)}
            </Text>
          </View>
          <TransferForm
            account={initialAccount}
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
