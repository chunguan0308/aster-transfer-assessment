import { memo, useCallback, useState } from 'react';
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ContactRow } from '../domain/contactRows';
import { useContacts } from '../hooks/useContacts';
import { styles } from './ContactPicker.styles';

interface Props {
  onSelect: (id: string) => void;
  onClose: () => void;
}
export function ContactPicker({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const { permission, contacts, access, searching } = useContacts(search);
  const select = useCallback(
    (row: ContactRow) => {
      if (!row.recipientId) {
        setNotice(
          row.phone
            ? 'This number isn’t registered for Aster demo transfers. Choose a saved recipient instead.'
            : 'This contact has no phone number. Choose another contact or a saved recipient.',
        );
        return;
      }
      onSelect(row.recipientId);
    },
    [onSelect],
  );
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ContactRow>) => <ContactItem item={item} onSelect={select} />,
    [select],
  );
  const rows = contacts.data?.pages.flatMap((page) => page.rows) ?? [];
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>
            Your contacts
          </Text>
          <IconButton icon="close" accessibilityLabel="Close contacts" onPress={onClose} />
        </View>
        <View style={styles.content}>
          <Text variant="bodyMedium">
            Choose a phone number. You’ll confirm the account name before sending.
          </Text>
          <Text variant="bodySmall">Contacts stay on this device and are not uploaded.</Text>
          {permission.data?.granted && (
            <TextInput
              accessibilityLabel="Search contact names"
              placeholder="Search names"
              value={search}
              onChangeText={setSearch}
              mode="outlined"
              clearButtonMode="while-editing"
            />
          )}
          {permission.data?.accessPrivileges === 'limited' && (
            <>
              <Text>Only contacts you allowed are shown.</Text>
              {Platform.OS === 'ios' && (
                <Button
                  loading={access.isPending}
                  disabled={access.isPending}
                  onPress={() => access.mutate(true)}
                >
                  Manage allowed contacts
                </Button>
              )}
            </>
          )}
          {!!notice && (
            <Text accessibilityRole="alert" style={styles.error}>
              {notice}
            </Text>
          )}
          {access.isError && (
            <Text accessibilityRole="alert" style={styles.error}>
              Couldn’t update contacts access. Try again.
            </Text>
          )}
        </View>
        {permission.isPending ? (
          <ActivityIndicator accessibilityLabel="Checking contact access" />
        ) : permission.isError ? (
          <View style={styles.empty}>
            <Text>Couldn’t check contact access.</Text>
            <Button
              onPress={() => {
                void permission.refetch();
              }}
            >
              Try again
            </Button>
          </View>
        ) : !permission.data.granted ? (
          <View style={styles.empty}>
            <Text variant="titleMedium">Contacts access is off</Text>
            <Text>You can keep using saved recipients without sharing contacts.</Text>
            {permission.data.canAskAgain ? (
              <Button
                mode="contained"
                disabled={access.isPending}
                loading={access.isPending}
                onPress={() => access.mutate(false)}
              >
                Allow contacts
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={() => {
                  void Linking.openSettings().catch(() =>
                    setNotice('Open your device Settings to allow contacts.'),
                  );
                }}
              >
                Open settings
              </Button>
            )}
            <Button onPress={onClose}>Use saved recipients</Button>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={rows}
            renderItem={renderItem}
            keyExtractor={contactKey}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            refreshing={contacts.isRefetching && !contacts.isFetchingNextPage}
            onRefresh={() => {
              void permission.refetch();
              void contacts.refetch();
            }}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (contacts.hasNextPage && !contacts.isFetching && !searching)
                void contacts.fetchNextPage();
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                {contacts.isPending || searching ? (
                  <ActivityIndicator accessibilityLabel="Loading contacts" />
                ) : contacts.isError ? (
                  <>
                    <Text>Couldn’t load your contacts.</Text>
                    <Button
                      onPress={() => {
                        void contacts.refetch();
                      }}
                    >
                      Try again
                    </Button>
                  </>
                ) : (
                  <>
                    <Text variant="titleMedium">
                      {search ? 'No matching contacts' : 'No contacts available'}
                    </Text>
                    <Text>
                      {search
                        ? 'Try a different name.'
                        : 'Add a contact on your device or use a saved recipient.'}
                    </Text>
                    <Button onPress={onClose}>Use saved recipients</Button>
                  </>
                )}
              </View>
            }
            ListFooterComponent={
              contacts.isFetchingNextPage ? (
                <ActivityIndicator style={styles.footer} />
              ) : contacts.isFetchNextPageError ? (
                <Button
                  onPress={() => {
                    void contacts.fetchNextPage();
                  }}
                >
                  Retry loading more
                </Button>
              ) : undefined
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
function contactKey(row: ContactRow) {
  return row.key;
}
const ContactItem = memo(function ContactItem({
  item,
  onSelect,
}: {
  item: ContactRow;
  onSelect: (row: ContactRow) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.phone || 'no phone number'}`}
      onPress={() => onSelect(item)}
      style={styles.row}
    >
      <Text variant="titleMedium">{item.name}</Text>
      <Text variant="bodyMedium" style={styles.phone}>
        {item.phone || 'No phone number'}
      </Text>
    </Pressable>
  );
});
