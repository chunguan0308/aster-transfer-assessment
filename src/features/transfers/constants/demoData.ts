import type { Account, Recipient } from '../domain/types';

export const initialAccount: Account = {
  id: 'aster-current',
  name: 'Everyday account',
  accountNumber: '8000123456',
  currency: 'MYR',
  balanceMinor: 1_250_000,
};

// Reserved fictional NANP numbers keep demo fixtures separate from real contacts.
export const recipients: readonly Recipient[] = [
  {
    id: 'aisha',
    name: 'Aisha Rahman',
    accountNumber: '8000101001',
    bankName: 'Aster Bank',
    phone: '+12025550101',
    color: '#E9DFF8',
  },
  {
    id: 'daniel',
    name: 'Daniel Tan',
    accountNumber: '8000101002',
    bankName: 'Aster Bank',
    phone: '+12025550102',
    color: '#DCEBE5',
  },
  {
    id: 'mei',
    name: 'Mei Ling',
    accountNumber: '8000101003',
    bankName: 'Aster Bank',
    phone: '+12025550103',
    color: '#F8E6D7',
  },
  {
    id: 'arjun',
    name: 'Arjun Kumar',
    accountNumber: '8000101004',
    bankName: 'Aster Bank',
    phone: '+12025550104',
    color: '#DAE8F8',
  },
  {
    id: 'sarah',
    name: 'Sarah Lim',
    accountNumber: '8000101005',
    bankName: 'Aster Bank',
    phone: '+12025550105',
    color: '#F5DDE5',
  },
  {
    id: 'adam',
    name: 'Adam Lee',
    accountNumber: '8000101006',
    bankName: 'Aster Bank',
    phone: '+12025550106',
    color: '#EAE8D4',
  },
];
