import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Recipient } from './types';

export const RecipientAvatar = memo(function RecipientAvatar({
  recipient,
}: {
  recipient: Recipient;
}) {
  return (
    <View
      style={[styles.avatar, { backgroundColor: recipient.color }]}
      importantForAccessibility="no"
    >
      <Text style={styles.initials}>
        {recipient.name
          .split(' ')
          .map((part) => part[0])
          .slice(0, 2)
          .join('')}
      </Text>
    </View>
  );
});
const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#223D37', fontWeight: '600', fontSize: 16 },
});
