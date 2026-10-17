import { StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

export const styles = StyleSheet.create({
  container: { gap: 20 },
  check: {
    alignSelf: 'center',
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    padding: 20,
  },
  title: { textAlign: 'center', fontWeight: '700', color: colors.ink },
  card: {
    padding: 24,
    gap: 18,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  detail: { gap: 6 },
  muted: { color: colors.muted },
  button: { minHeight: 52 },
});
