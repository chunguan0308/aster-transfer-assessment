import { StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

export const styles = StyleSheet.create({
  container: { gap: 20 },
  back: { alignSelf: 'flex-start', marginLeft: -12 },
  title: { fontWeight: '700', color: colors.ink },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  divider: { width: '100%', marginVertical: 8 },
  safety: { color: colors.muted, lineHeight: 22 },
});
