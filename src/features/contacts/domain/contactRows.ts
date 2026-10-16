import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { recipients } from '../../transfers/constants/demoData';

export interface DeviceContact {
  id: string;
  fullName: string | null;
  phones: { number?: string; label?: string }[];
}
export interface ContactRow {
  key: string;
  name: string;
  phone: string;
  recipientId?: string;
}
export function normalizePhone(number: string): string | undefined {
  const phone = parsePhoneNumberFromString(number, 'MY');
  return phone?.isPossible() ? phone.number : undefined;
}
export function contactRows(contacts: DeviceContact[]): ContactRow[] {
  return contacts.flatMap((contact) => {
    const numbers = [
      ...new Set(
        contact.phones
          .map((phone) => phone.number?.trim())
          .filter((phone): phone is string => !!phone),
      ),
    ];
    return (numbers.length ? numbers : ['']).map((phone) => {
      const normalized = normalizePhone(phone);
      return {
        key: `${contact.id}:${phone}`,
        name: contact.fullName?.trim() || 'Unnamed contact',
        phone,
        recipientId: normalized
          ? recipients.find((recipient) => recipient.phone === normalized)?.id
          : undefined,
      };
    });
  });
}
