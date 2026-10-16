import { StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, paddingBottom: 32 },
  inner: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: 24, flex: 1 },
});
