import { styles } from './index.styles';
import { useState } from 'react';
import { ContactPicker } from '@/features/contacts/components/ContactPicker';
import { Controller } from 'react-hook-form';
import { Keyboard, Pressable, ScrollView, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { recipients } from '@/features/transfers/constants/demoData';
import { formatMoney } from '@/features/transfers/domain/money';
import { RecipientAvatar } from '@/features/transfers/components/RecipientAvatar';
import type { Account, TransferDraft } from '@/features/transfers/domain/types';
import type { TransferFormInput } from '@/features/transfers/domain/validation';
import { useTransferForm } from './hooks/useTransferForm';
import { MAX_NOTE_LENGTH } from '@/features/transfers/constants/limits';

interface Props {
  account: Account;
  initialValues?: Partial<TransferFormInput>;
  onReview: (draft: TransferDraft) => void;
}
export function TransferForm({ account, initialValues, onReview }: Props) {
  const [contactsOpen, setContactsOpen] = useState(false);
  const { control, errors, recipientId, recipient, selectRecipient, review } = useTransferForm(
    account.balanceMinor,
    initialValues,
    onReview,
  );
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text variant="titleLarge" accessibilityRole="header" style={styles.title}>
          Send money
        </Text>
        <Text variant="bodyMedium">Instant · No fees</Text>
      </View>
      <View style={styles.heading}>
        <Text variant="labelLarge">Choose a recipient</Text>
        <Button compact icon="account-box-outline" onPress={() => setContactsOpen(true)}>
          From contacts
        </Button>
      </View>
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
            onPress={() => selectRecipient(item.id)}
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
        <Text variant="labelLarge">Amount (MYR)</Text>
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextInput
              ref={ref}
              accessibilityLabel="Amount in Malaysian ringgit"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              mode="outlined"
              error={!!errors.amount}
              maxLength={18}
              style={styles.amountInput}
              contentStyle={styles.amountContent}
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
      <Text variant="labelLarge">Note (optional)</Text>
      <Controller
        control={control}
        name="note"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextInput
            ref={ref}
            accessibilityLabel="Note (optional)"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            mode="outlined"
            maxLength={MAX_NOTE_LENGTH}
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
        onPress={review}
        maxFontSizeMultiplier={2}
      >
        Review transfer
      </Button>
      {contactsOpen && (
        <ContactPicker
          onSelect={(id) => {
            selectRecipient(id);
            setContactsOpen(false);
          }}
          onClose={() => setContactsOpen(false)}
        />
      )}
      <Text variant="bodySmall" style={styles.footer}>
        You’ll review the details before authorizing.
      </Text>
    </View>
  );
}
