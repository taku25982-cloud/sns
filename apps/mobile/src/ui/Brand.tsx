import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from './theme';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.row} accessibilityRole="header">
      <MaterialCommunityIcons name="run-fast" size={compact ? 30 : 44} color={theme.blue} />
      <Text style={[styles.title, compact && styles.compact]}>陸上SNS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  title: { color: theme.navy, fontSize: 38, fontWeight: '800', letterSpacing: 0.5 },
  compact: { fontSize: 27 },
});
