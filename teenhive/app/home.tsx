import { StyleSheet, View } from 'react-native';
import Text from '@/components/Text';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Teen Hive</Text>
      <Text style={styles.subtitle}>You're signed up!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#666' },
});
