import { styles, avatarStyle } from './index.styles';
import { memo } from 'react';
import { Text, View } from 'react-native';
import type { Recipient } from '@/features/transfers/domain/types';

export const RecipientAvatar = memo(function RecipientAvatar({
  recipient,
}: {
  recipient: Recipient;
}) {
  return (
    <View
      style={avatarStyle(recipient.color)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.initials} maxFontSizeMultiplier={1}>
        {recipient.name
          .split(' ')
          .map((part) => part[0])
          .slice(0, 2)
          .join('')}
      </Text>
    </View>
  );
});
