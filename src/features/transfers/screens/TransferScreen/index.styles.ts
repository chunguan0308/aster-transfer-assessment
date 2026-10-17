import { StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

export const styles = StyleSheet.create({
  error: { color: colors.ink },
  action: { minHeight: 54 },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  brandText: { fontWeight: '800', letterSpacing: -1, color: colors.ink },

  balance: { borderRadius: 24, backgroundColor: colors.ink, padding: 24, gap: 16 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: colors.onDark, flexShrink: 1 },
  balanceValue: { color: colors.onPrimary, fontWeight: '600', letterSpacing: -1 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto',
  },
  caption: { color: colors.muted, flexShrink: 1 },
});
