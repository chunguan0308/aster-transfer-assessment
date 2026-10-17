import { amountInput, formatMoney, parseAmount } from '@/features/transfers/domain/money';
import { transferSchema } from '@/features/transfers/domain/validation';

test.each([
  ['0.01', 1],
  ['0.10', 10],
  ['.50', 50],
  ['12.', 1200],
  ['12.30', 1230],
  [' 0012.34 ', 1234],
  ['90071992547409.91', Number.MAX_SAFE_INTEGER],
])('parses %s into exact integer minor units', (text, minor) => {
  expect(parseAmount(text)).toBe(minor);
});

test.each([
  '',
  '0',
  '0.00',
  '-1',
  '+1',
  '1e3',
  '1,000',
  '1.001',
  '1..2',
  'NaN',
  'Infinity',
  '90071992547409.92',
])('rejects unsafe or malformed amount %s', (text) => {
  expect(() => parseAmount(text)).toThrow();
});

test('formats currency and creates a lossless repeat-transfer input', () => {
  expect(formatMoney(123456)).toMatch(/1,234\.56/);
  expect(amountInput(10)).toBe('0.10');
  expect(parseAmount(amountInput(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
  expect(() => formatMoney(1.2)).toThrow();
});

test('accepts an exact-balance transfer and trims an optional note', () => {
  expect(
    transferSchema(100).parse({ recipientId: 'aisha', amount: '1.00', note: ' Thanks ' }),
  ).toEqual({ recipientId: 'aisha', amount: 100, note: 'Thanks' });
});

test('reports recipient, insufficient-balance, and note errors at the relevant fields', () => {
  const result = transferSchema(100).safeParse({
    recipientId: '',
    amount: '1.01',
    note: 'x'.repeat(141),
  });
  expect(result.success).toBe(false);
  if (!result.success)
    expect(result.error.issues.map((issue) => issue.path[0])).toEqual([
      'recipientId',
      'amount',
      'note',
    ]);
});

test('currency display preserves the final sen throughout the accepted safe-integer range', () => {
  expect(formatMoney(Number.MAX_SAFE_INTEGER)).toBe('RM\u00a090,071,992,547,409.91');
  expect(formatMoney(-Number.MAX_SAFE_INTEGER)).toBe('-RM\u00a090,071,992,547,409.91');
  expect(formatMoney(-1)).toBe('-RM\u00a00.01');
});

test('currency display works on a native runtime without Intl formatToParts', () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl.NumberFormat.prototype, 'formatToParts')!;
  Object.defineProperty(Intl.NumberFormat.prototype, 'formatToParts', {
    ...descriptor,
    value: undefined,
  });
  try {
    expect(formatMoney(1234)).toBe('RM\u00a012.34');
    expect(formatMoney(0)).toBe('RM\u00a00.00');
    expect(formatMoney(-1)).toBe('-RM\u00a00.01');
  } finally {
    Object.defineProperty(Intl.NumberFormat.prototype, 'formatToParts', descriptor);
  }
});
