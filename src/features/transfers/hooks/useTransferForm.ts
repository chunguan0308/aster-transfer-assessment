import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Keyboard } from 'react-native';
import { recipients } from '../constants/demoData';
import type { TransferDraft } from '../domain/types';
import {
  transferSchema,
  type TransferFormInput,
  type TransferFormOutput,
} from '../domain/validation';

export function useTransferForm(
  balanceMinor: number,
  initialValues: Partial<TransferFormInput> | undefined,
  onReview: (draft: TransferDraft) => void,
) {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TransferFormInput, unknown, TransferFormOutput>({
    resolver: zodResolver(transferSchema(balanceMinor)),
    defaultValues: { recipientId: '', amount: '', note: '', ...initialValues },
    mode: 'onTouched',
  });
  const recipientId = useWatch({ control, name: 'recipientId' });
  const recipient = recipients.find((item) => item.id === recipientId);
  const review = () => {
    void handleSubmit(({ recipientId: id, amount, note }) => {
      Keyboard.dismiss();
      onReview({ recipientId: id, amountMinor: amount, note });
    })();
  };
  const selectRecipient = (id: string) => setValue('recipientId', id, { shouldValidate: true });
  return { control, errors, recipientId, recipient, selectRecipient, review };
}
