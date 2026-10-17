const currency = new Intl.NumberFormat('en-MY', {
  style: 'currency',
  currency: 'MYR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function parseAmount(input: string): number {
  const text = input.trim();
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text)) {
    throw new Error('Enter an amount with up to 2 decimal places.');
  }
  const [whole, fraction = ''] = text.split('.');
  const minor = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor)) throw new Error('This amount is too large.');
  if (minor <= 0) throw new Error('Enter an amount greater than RM 0.00.');
  return minor;
}

export function formatMoney(minor: number): string {
  if (!Number.isSafeInteger(minor)) throw new Error('Invalid money value.');
  const fraction = String(Math.abs(minor) % 100).padStart(2, '0');
  // Format whole ringgit separately so decimal conversion cannot round away a sen.
  return currency
    .formatToParts(Math.trunc(minor / 100))
    .map((part) => (part.type === 'fraction' ? fraction : part.value))
    .join('');
}

export function amountInput(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error('Invalid money value.');
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}`;
}
