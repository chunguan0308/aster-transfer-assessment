import { StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  title: { fontWeight: '700', flex: 1 },
  content: { paddingHorizontal: 24, gap: 16, paddingBottom: 12 },
  list: { flex: 1 },
  row: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  phone: { color: colors.muted },
  empty: { padding: 24, gap: 16 },
  error: { color: colors.error },
  footer: { padding: 16 },
});
