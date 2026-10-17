import { contactRows, normalizePhone } from '@/features/contacts/domain/contactRows';

test('normalizes international and Malaysian numbers without matching names', () => {
  expect(normalizePhone('(202) 555-0101')).not.toBe('+12025550101');
  expect(normalizePhone('+1 (202) 555-0101')).toBe('+12025550101');
  expect(normalizePhone('012-345 6789')).toBe('+60123456789');
  expect(normalizePhone('not a number')).toBeUndefined();
});
test('resolves only a registered number, preserves multiple choices and handles missing fields', () => {
  const rows = contactRows([
    {
      id: 'one',
      fullName: 'A misleading contact name',
      phones: [
        { number: '+1 (202) 555-0101' },
        { number: '+12025550102' },
        { number: '+12025550102' },
      ],
    },
    { id: 'two', fullName: null, phones: [] },
    { id: 'three', fullName: 'Aisha Rahman', phones: [{ number: '+12025550199' }] },
  ]);
  expect(rows).toHaveLength(4);
  expect(rows[0]).toMatchObject({ name: 'A misleading contact name', recipientId: 'aisha' });
  expect(rows[1].recipientId).toBe('daniel');
  expect(rows[2]).toMatchObject({ name: 'Unnamed contact', phone: '' });
  expect(rows[3].recipientId).toBeUndefined();
  expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
});
