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
  // Fixed English/MYR display avoids optional native Intl APIs and floating-point conversion.
  const digits = String(Math.abs(minor)).padStart(3, '0');
  const whole = digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${minor < 0 ? '-' : ''}RM\u00a0${whole}.${digits.slice(-2)}`;
}

export function amountInput(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error('Invalid money value.');
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}`;
}
