import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.heading}>陸上SNS</Text>
        <Text style={styles.description}>開発用の起動画面です。</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  heading: { color: '#12213A', fontSize: 24, fontWeight: '700' },
  description: { color: '#526277', fontSize: 14 },
});
