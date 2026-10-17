import { memo, useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { ActivityIndicator, Button, IconButton, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { formatMoney } from '@/features/transfers/domain/money';
import type { TransferReceipt } from '@/features/transfers/domain/types';
import { useHistory } from './hooks/useHistory';
import { RecipientAvatar } from '@/features/transfers/components/RecipientAvatar/RecipientAvatar';
import { TransferReceiptView } from '@/features/transfers/components/TransferReceiptView/TransferReceiptView';
import { styles } from './HistoryModal.styles';

export function HistoryModal({
  onClose,
  onRepeat,
}: {
  onClose: () => void;
  onRepeat: (receipt: TransferReceipt) => void;
}) {
  const history = useHistory();
  const [selected, setSelected] = useState<TransferReceipt | null>(null);
  const receipts = history.data?.pages.flatMap((page) => page.items) ?? [];
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TransferReceipt>) => (
      <HistoryItem receipt={item} onOpen={setSelected} />
    ),
    [],
  );
  const back = () => {
    if (selected) setSelected(null);
    else onClose();
  };
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={back}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe} accessibilityViewIsModal>
          <View style={styles.header}>
            {selected && (
              <IconButton
                icon="arrow-left"
                accessibilityLabel="Back to activity"
                onPress={() => setSelected(null)}
              />
            )}
            <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>
              {selected ? 'Transfer details' : 'Activity'}
            </Text>
            <IconButton icon="close" accessibilityLabel="Close activity" onPress={onClose} />
          </View>
          {selected ? (
            <ScrollView contentContainerStyle={styles.receipt}>
              <TransferReceiptView
                receipt={selected}
                onDone={() => setSelected(null)}
                onRepeat={() => onRepeat(selected)}
              />
            </ScrollView>
          ) : (
            <>
              <Text style={styles.introduction}>
                Your completed transfers, saved on this device.
              </Text>
              {history.isError && receipts.length > 0 && (
                <View style={styles.empty}>
                  <Text accessibilityRole="alert">
                    Couldn’t refresh activity. Your saved transfers are still shown.
                  </Text>
                  <Button
                    onPress={() => {
                      void history.refetch();
                    }}
                  >
                    Try again
                  </Button>
                </View>
              )}
              <FlatList
                style={styles.list}
                data={receipts}
                renderItem={renderItem}
                keyExtractor={receiptKey}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={7}
                refreshing={history.isRefetching && !history.isFetchingNextPage}
                onRefresh={() => {
                  void history.refetch();
                }}
                onEndReachedThreshold={0.4}
                onEndReached={() => {
                  if (history.hasNextPage && !history.isFetching) void history.fetchNextPage();
                }}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    {history.isPending ? (
                      <ActivityIndicator accessibilityLabel="Loading activity" />
                    ) : history.isError ? (
                      <>
                        <Text accessibilityRole="alert">Couldn’t load activity.</Text>
                        <Button
                          onPress={() => {
                            void history.refetch();
                          }}
                        >
                          Try again
                        </Button>
                      </>
                    ) : (
                      <>
                        <Text variant="titleLarge">Your first transfer starts here.</Text>
                        <Text>
                          Completed transfers will appear here with a receipt and a quick way to
                          send again.
                        </Text>
                        <Button mode="contained" onPress={onClose}>
                          Make a transfer
                        </Button>
                      </>
                    )}
                  </View>
                }
                ListFooterComponent={
                  history.isFetchingNextPage ? (
                    <ActivityIndicator style={styles.footer} />
                  ) : history.isFetchNextPageError ? (
                    <Button
                      onPress={() => {
                        void history.fetchNextPage();
                      }}
                    >
                      Retry loading more
                    </Button>
                  ) : undefined
                }
              />
            </>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
function receiptKey(receipt: TransferReceipt) {
  return receipt.idempotencyKey;
}
const HistoryItem = memo(function HistoryItem({
  receipt,
  onOpen,
}: {
  receipt: TransferReceipt;
  onOpen: (receipt: TransferReceipt) => void;
}) {
  const date = new Date(receipt.createdAt).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <Pressable
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${receipt.recipient.name}, sent ${formatMoney(receipt.amountMinor)}, ${date}, completed`}
      onPress={() => onOpen(receipt)}
    >
      <RecipientAvatar recipient={receipt.recipient} />
      <View style={styles.details}>
        <Text variant="titleMedium">{receipt.recipient.name}</Text>
        <Text variant="bodySmall" style={styles.muted}>
          {date} · Completed
        </Text>
        <Text variant="titleMedium" style={styles.amount}>
          − {formatMoney(receipt.amountMinor)}
        </Text>
      </View>
    </Pressable>
  );
});
