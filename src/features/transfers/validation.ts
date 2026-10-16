import { z } from 'zod';

import { parseAmount } from './money';

export function transferSchema(balanceMinor: number) {
  return z.object({
    recipientId: z.string().min(1, 'Choose a recipient to continue.'),
    amount: z.string().transform((value, context) => {
      try {
        const minor = parseAmount(value);
        if (minor > balanceMinor) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'This amount exceeds your available balance.',
          });
          return z.NEVER;
        }
        return minor;
      } catch (error) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : 'Enter a valid amount.',
        });
        return z.NEVER;
      }
    }),
    note: z.string().trim().max(140, 'Keep your note to 140 characters.'),
  });
}

export type TransferFormInput = z.input<ReturnType<typeof transferSchema>>;
export type TransferFormOutput = z.output<ReturnType<typeof transferSchema>>;
