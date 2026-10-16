import { StyleSheet, View } from 'react-native';
import { Button, Divider, Icon, Text } from 'react-native-paper';
import { colors } from '../../theme';
import { formatMoney } from './money';
import type { TransferReceipt } from './types';

export function TransferReceiptView({
  receipt,
  onDone,
  onRepeat,
}: {
  receipt: TransferReceipt;
  onDone: () => void;
  onRepeat?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.check}>
        <Icon source="check" color={colors.primary} size={40} />
      </View>
      <Text variant="headlineLarge" accessibilityRole="header" style={styles.title}>
        Money sent.
      </Text>
      <Text variant="bodyLarge">{receipt.recipient.name} received your transfer.</Text>
      <Text variant="displaySmall" style={styles.title}>
        {formatMoney(receipt.amountMinor)}
      </Text>
      <View style={styles.card}>
        <Detail label="Status" value="Completed" />
        <Divider />
        <Detail
          label="To"
          value={`${receipt.recipient.name}\n${receipt.recipient.bankName} · ${receipt.recipient.accountNumber}`}
        />
        <Detail
          label="Date"
          value={new Date(receipt.createdAt).toLocaleString('en-MY', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        />
        <Detail label="Transfer fee" value="RM 0.00" />
        {receipt.note !== '' && <Detail label="Note" value={receipt.note} />}
        <Detail label="Reference" value={receipt.id} />
        <Divider />
        <Detail label="Balance after transfer" value={formatMoney(receipt.balanceAfterMinor)} />
      </View>
      <Button mode="contained" onPress={onDone} contentStyle={styles.button}>
        Done
      </Button>
      {onRepeat && (
        <Button mode="outlined" onPress={onRepeat} contentStyle={styles.button}>
          Send again
        </Button>
      )}
    </View>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text variant="labelMedium" style={styles.muted}>
        {label}
      </Text>
      <Text variant="bodyMedium" selectable>
        {value}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 20 },
  check: { alignSelf: 'center', borderRadius: 40, backgroundColor: '#E1F1E9', padding: 20 },
  title: { textAlign: 'center', fontWeight: '700', color: colors.ink },
  card: {
    padding: 24,
    gap: 18,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  detail: { gap: 6 },
  muted: { color: colors.muted },
  button: { minHeight: 52 },
});
