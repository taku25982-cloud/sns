import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { theme } from './theme';

export function PrimaryButton({ label, onPress, disabled = false, loading = false }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (disabled || loading) && styles.disabled, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color="white" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.blue },
  disabled: { backgroundColor: '#A5BCE7' },
  pressed: { opacity: 0.82 },
  label: { color: 'white', fontSize: 17, fontWeight: '700' },
});
