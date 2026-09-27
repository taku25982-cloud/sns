import { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from './Brand';
import { theme } from './theme';

export function SafetyScreen({ title, children }: { title: string; children: ReactNode }) {
  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" style={styles.back}>
        <Ionicons name="chevron-back" size={28} color={theme.navy} />
      </Pressable>
      <Brand compact />
      <View style={styles.back} />
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
    <View style={styles.bottomBar}>
      {([
        ['ホーム', 'home-outline'], ['さがす', 'search-outline'], ['投稿', 'add-circle-outline'],
        ['通知', 'notifications-outline'], ['マイページ', 'person-outline'],
      ] as const).map(([label, icon]) => <Pressable key={label} onPress={() => router.replace('/home')} style={styles.bottomTab} accessibilityRole="button" accessibilityLabel={`${label}へ戻る`}>
        <Ionicons name={icon} size={27} color={label === 'マイページ' ? theme.blue : '#4C5569'} />
        <Text style={[styles.bottomLabel, label === 'マイページ' && styles.activeLabel]}>{label}</Text>
      </Pressable>)}
    </View>
  </SafeAreaView>;
}

export function SafetySection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>;
}

export function SafetyRow({ label, value, detail, icon, onPress, danger = false }: { label: string; value?: string; detail?: string; icon?: keyof typeof Ionicons.glyphMap; onPress?: () => void; danger?: boolean }) {
  return <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : 'text'} style={styles.row}>
    {icon && <Ionicons name={icon} size={25} color={danger ? '#E14B4B' : theme.navy} style={styles.rowIcon} />}
    <View style={styles.rowCopy}><Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>{detail && <Text style={styles.rowDetail}>{detail}</Text>}</View>
    <View style={styles.rowEnd}>{value && <Text style={styles.value}>{value}</Text>}{onPress && <Ionicons name="chevron-forward" size={20} color="#9BA5B5" />}</View>
  </Pressable>;
}

export function PreviewNotice({ children }: { children?: ReactNode }) {
  return <View style={styles.notice}><Ionicons name="information-circle-outline" size={22} color={theme.blue} /><Text style={styles.noticeText}>{children ?? '開発プレビューです。変更は保存されません。'}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 22, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', color: theme.navy, marginTop: 20, marginBottom: 20 },
  section: { marginBottom: 10, backgroundColor: '#F1F5FA', borderRadius: 12, overflow: 'hidden' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#73819B', paddingHorizontal: 12, paddingVertical: 9 },
  sectionBody: { backgroundColor: 'white', marginHorizontal: 4, marginBottom: 4, borderRadius: 11 },
  row: { minHeight: 58, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowIcon: { width: 38 },
  rowCopy: { flex: 1, paddingVertical: 8 },
  rowLabel: { fontSize: 16, color: theme.navy, fontWeight: '600' },
  rowDetail: { color: theme.muted, fontSize: 12, marginTop: 3 },
  danger: { color: '#E14B4B' },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { color: theme.muted, fontSize: 13 },
  notice: { backgroundColor: theme.paleBlue, borderRadius: 12, padding: 14, flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginTop: 8 },
  noticeText: { flex: 1, color: theme.navy, fontSize: 13, lineHeight: 20 },
  bottomBar: { height: 68, borderTopWidth: 1, borderColor: theme.border, flexDirection: 'row', backgroundColor: 'white' },
  bottomTab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bottomLabel: { color: '#5D6679', fontSize: 10 },
  activeLabel: { color: theme.blue, fontWeight: '700' },
});
