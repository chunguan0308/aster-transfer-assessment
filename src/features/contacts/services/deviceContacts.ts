import {
  Contact,
  ContactField,
  ContactsSortOrder,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-contacts';
import { contactRows } from '../domain/contactRows';

export const CONTACT_PAGE_SIZE = 50;
export async function contactPermission() {
  const permission = await getPermissionsAsync();
  return permission.status === 'undetermined' ? requestPermissionsAsync() : permission;
}
export { requestPermissionsAsync as requestContactPermission } from 'expo-contacts';
export async function loadContacts(name: string, offset: number) {
  const contacts = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES], {
    limit: CONTACT_PAGE_SIZE,
    offset,
    name: name || undefined,
    sortOrder: ContactsSortOrder.GivenName,
  });
  return {
    rows: contactRows(contacts),
    nextOffset: contacts.length === CONTACT_PAGE_SIZE ? offset + CONTACT_PAGE_SIZE : undefined,
  };
}
export async function manageLimitedContacts() {
  await Contact.presentAccessPicker();
}
