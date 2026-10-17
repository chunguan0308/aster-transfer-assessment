import { StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

export const styles = StyleSheet.create({
  amountContent: { fontSize: 30 },
  container: { gap: 16 },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: { fontWeight: '700' },
  recipients: { gap: 8 },
  person: {
    minWidth: 76,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 18,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  destination: { borderLeftColor: colors.primary, borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
  amount: { gap: 4 },
  amountInput: { backgroundColor: colors.surface },
  hint: { paddingHorizontal: 12, color: colors.muted },
  button: { minHeight: 54 },
  footer: { textAlign: 'center', color: colors.muted },
});
