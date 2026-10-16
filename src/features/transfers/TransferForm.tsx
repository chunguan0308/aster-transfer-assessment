import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { colors } from '../../theme';
import { recipients } from './fixtures';
import { formatMoney } from './money';
import { RecipientAvatar } from './RecipientAvatar';
import type { Account, TransferDraft } from './types';
import { transferSchema, type TransferFormInput, type TransferFormOutput } from './validation';

interface Props {
  account: Account;
  initialValues?: Partial<TransferFormInput>;
  onReview: (draft: TransferDraft) => void;
}
export function TransferForm({ account, initialValues, onReview }: Props) {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TransferFormInput, unknown, TransferFormOutput>({
    resolver: zodResolver(transferSchema(account.balanceMinor)),
    defaultValues: { recipientId: '', amount: '', note: '', ...initialValues },
    mode: 'onTouched',
  });
  const recipientId = useWatch({ control, name: 'recipientId' });
  const recipient = recipients.find((item) => item.id === recipientId);
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text variant="titleLarge" accessibilityRole="header" style={styles.title}>
          Send money
        </Text>
        <Text variant="bodyMedium">Instant · No fees</Text>
      </View>
      <Text variant="labelLarge">Choose a recipient</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recipients}
      >
        {recipients.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityLabel={item.name}
            accessibilityState={{ checked: recipientId === item.id }}
            onPress={() => setValue('recipientId', item.id, { shouldValidate: true })}
            style={[styles.person, recipientId === item.id && styles.selected]}
          >
            <RecipientAvatar recipient={item} />
            <Text variant="labelMedium" numberOfLines={1}>
              {item.name.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {errors.recipientId && (
        <HelperText type="error" accessibilityRole="alert">
          {errors.recipientId.message}
        </HelperText>
      )}
      {recipient && (
        <View style={styles.destination}>
          <Text variant="labelLarge">{recipient.name}</Text>
          <Text variant="bodySmall">
            {recipient.bankName} · {recipient.accountNumber}
          </Text>
        </View>
      )}
      <View style={styles.amount}>
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextInput
              ref={ref}
              label="Amount (MYR)"
              accessibilityLabel="Amount in Malaysian ringgit"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              mode="outlined"
              error={!!errors.amount}
              maxLength={18}
              style={styles.amountInput}
              contentStyle={{ fontSize: 30 }}
              left={<TextInput.Affix text="RM" />}
              placeholder="0.00"
            />
          )}
        />
        {errors.amount ? (
          <HelperText type="error" accessibilityRole="alert">
            {errors.amount.message}
          </HelperText>
        ) : (
          <Text variant="bodySmall" style={styles.hint}>
            Available {formatMoney(account.balanceMinor)}
          </Text>
        )}
      </View>
      <Controller
        control={control}
        name="note"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextInput
            ref={ref}
            label="Note (optional)"
            accessibilityLabel="Note (optional)"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            mode="outlined"
            maxLength={140}
            error={!!errors.note}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            placeholder="What's it for?"
          />
        )}
      />
      {errors.note && (
        <HelperText type="error" accessibilityRole="alert">
          {errors.note.message}
        </HelperText>
      )}
      <Button
        mode="contained"
        contentStyle={styles.button}
        onPress={() => {
          void handleSubmit(({ recipientId: id, amount, note }) => {
            Keyboard.dismiss();
            onReview({ recipientId: id, amountMinor: amount, note });
          })();
        }}
      >
        Review transfer
      </Button>
      <Text variant="bodySmall" style={styles.footer}>
        You’ll review the details before authorizing.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 16 },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: { fontWeight: '700' },
  recipients: { gap: 8 },
  person: {
    width: 76,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 18,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#E8F2EC' },
  destination: { borderLeftColor: colors.primary, borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
  amount: { gap: 4 },
  amountInput: { backgroundColor: colors.surface },
  hint: { paddingHorizontal: 12, color: colors.muted },
  button: { minHeight: 54 },
  footer: { textAlign: 'center', color: colors.muted },
});
