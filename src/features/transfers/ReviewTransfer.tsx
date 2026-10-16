import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { colors } from '../../theme';
import { formatMoney } from './money';
import { RecipientAvatar } from './RecipientAvatar';
import type { Recipient, TransferDraft } from './types';

export function ReviewTransfer({
  draft,
  recipient,
  onEdit,
  children,
  busy = false,
}: {
  draft: TransferDraft;
  recipient: Recipient;
  onEdit: () => void;
  children?: ReactNode;
  busy?: boolean;
}) {
  return (
    <View style={styles.container}>
      <Button icon="arrow-left" onPress={onEdit} disabled={busy} style={styles.back}>
        Edit details
      </Button>
      <Text variant="headlineLarge" accessibilityRole="header" style={styles.title}>
        One last look.
      </Text>
      <Text variant="bodyLarge">Make sure these details are right.</Text>
      <View style={styles.card}>
        <RecipientAvatar recipient={recipient} />
        <Text variant="titleLarge" style={styles.title}>
          {recipient.name}
        </Text>
        <Text>
          {recipient.bankName} · {recipient.accountNumber}
        </Text>
        <Divider style={styles.divider} />
        <Text variant="bodyMedium">You’re sending</Text>
        <Text variant="displaySmall" style={styles.title}>
          {formatMoney(draft.amountMinor)}
        </Text>
        <Text variant="bodyMedium">Transfer fee · RM 0.00</Text>
        {draft.note !== '' && (
          <>
            <Divider style={styles.divider} />
            <Text variant="labelMedium">NOTE</Text>
            <Text>{draft.note}</Text>
          </>
        )}
      </View>
      <Text variant="bodyMedium" style={styles.safety}>
        Only authorize if you know the recipient. Aster will never ask you to transfer money to a
        “safe account”.
      </Text>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 20 },
  back: { alignSelf: 'flex-start', marginLeft: -12 },
  title: { fontWeight: '700', color: colors.ink },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  divider: { width: '100%', marginVertical: 8 },
  safety: { color: colors.muted, lineHeight: 22 },
});
