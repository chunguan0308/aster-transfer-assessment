import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/tokens';

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  title: { fontWeight: '700', flex: 1 },
  introduction: { paddingHorizontal: 24, paddingBottom: 20, color: colors.muted },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: colors.surface,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  details: { flex: 1, gap: 6 },
  amount: { fontWeight: '700' },
  muted: { color: colors.muted },
  empty: { padding: 24, gap: 16 },
  receipt: { padding: 24 },
  footer: { padding: 20 },
});
