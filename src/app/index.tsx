import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Aster Transfer
      </Text>
      <Text style={styles.description}>Payment transfer assessment</Text>
      <Text style={styles.notice}>
        Development foundation — transfer features are not implemented yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F6F8FA' },
  title: { color: '#172B3A', fontSize: 32, fontWeight: '700' },
  description: { marginTop: 12, color: '#172B3A', fontSize: 18 },
  notice: { marginTop: 24, color: '#475569', fontSize: 16 },
});
