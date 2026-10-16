import { colors } from '../../../theme/tokens';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.avatarText, fontWeight: '600', fontSize: 16 },
});

export function avatarStyle(color: string) {
  return [styles.avatar, { backgroundColor: color }];
}
