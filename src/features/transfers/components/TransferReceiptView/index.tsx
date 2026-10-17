import { styles } from './index.styles';
import { View } from 'react-native';
import { Button, Divider, Icon, Text } from 'react-native-paper';
import { colors } from '@/theme/tokens';
import { formatMoney } from '@/features/transfers/domain/money';
import type { TransferReceipt } from '@/features/transfers/domain/types';

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
      <Text
        variant="displaySmall"
        style={styles.title}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.3}
      >
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
