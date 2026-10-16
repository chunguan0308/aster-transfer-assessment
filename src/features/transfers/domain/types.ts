export interface Recipient {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  phone: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  accountNumber: string;
  currency: 'MYR';
  balanceMinor: number;
}

export interface TransferDraft {
  recipientId: string;
  amountMinor: number;
  note: string;
}

export interface TransferReceipt extends TransferDraft {
  id: string;
  idempotencyKey: string;
  recipient: Recipient;
  createdAt: string;
  balanceAfterMinor: number;
  status: 'completed';
}
