import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '../ui/Brand';
import { theme } from '../ui/theme';

const tabs = [
  { label: 'ホーム', icon: 'home-outline' },
  { label: 'さがす', icon: 'search-outline' },
  { label: '投稿', icon: 'add-circle-outline' },
  { label: '通知', icon: 'notifications-outline' },
  { label: 'マイページ', icon: 'person-outline' },
] as const;

export default function HomeScreen() {
  const [active, setActive] = useState<(typeof tabs)[number]['label']>('ホーム');
  const [feedTab, setFeedTab] = useState<'おすすめ' | 'フォロー中'>('おすすめ');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Brand compact />
        <Pressable accessibilityLabel="メッセージ、準備中" accessibilityRole="button" style={styles.messageButton}>
          <Ionicons name="paper-plane-outline" size={27} color={theme.navy} />
        </Pressable>
      </View>
      {active === 'ホーム' ? (
        <>
          <View style={styles.feedTabs}>
            {(['おすすめ', 'フォロー中'] as const).map((label) => (
              <Pressable key={label} onPress={() => setFeedTab(label)} accessibilityRole="tab" accessibilityState={{ selected: feedTab === label }} style={[styles.feedTab, feedTab === label && styles.selectedFeedTab]}>
                <Text style={[styles.feedTabText, feedTab === label && styles.selectedFeedText]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView contentContainerStyle={styles.emptyFeed}>
            <View style={styles.emptyIcon}><Ionicons name="walk-outline" size={34} color={theme.blue} /></View>
            <Text style={styles.emptyTitle}>{feedTab === 'おすすめ' ? 'まだ投稿がありません' : 'フォロー中の投稿はありません'}</Text>
            <Text style={styles.emptyText}>{feedTab === 'おすすめ' ? '陸上の投稿が集まるまで、少しお待ちください。' : 'フォローした人の投稿が、ここに表示されます。'}</Text>
          </ScrollView>
        </>
      ) : (
        <View style={styles.otherContent}>
          <Text style={styles.otherTitle}>{active}</Text>
          <Text style={styles.emptyText}>この画面は準備中です。</Text>
        </View>
      )}
      <View style={styles.bottomBar} accessibilityRole="tablist">
        {tabs.map((tab) => (
          <Pressable key={tab.label} onPress={() => setActive(tab.label)} accessibilityRole="tab" accessibilityState={{ selected: active === tab.label }} style={styles.bottomTab}>
            <Ionicons name={tab.icon} size={27} color={active === tab.label ? theme.blue : '#4C5569'} />
            <Text style={[styles.bottomLabel, active === tab.label && styles.bottomLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17 },
  headerSpacer: { width: 44 },
  messageButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  feedTabs: { height: 52, flexDirection: 'row', borderBottomWidth: 1, borderColor: theme.border },
  feedTab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  selectedFeedTab: { borderBottomWidth: 3, borderBottomColor: theme.blue },
  feedTabText: { color: '#626C80', fontSize: 16, fontWeight: '600' },
  selectedFeedText: { color: theme.blue, fontWeight: '700' },
  emptyFeed: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 70 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.paleBlue, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  emptyTitle: { color: theme.navy, fontSize: 21, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: theme.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  otherContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  otherTitle: { color: theme.navy, fontSize: 24, fontWeight: '700' },
  bottomBar: { height: 68, borderTopWidth: 1, borderColor: theme.border, flexDirection: 'row', backgroundColor: 'white' },
  bottomTab: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bottomLabel: { color: '#5D6679', fontSize: 10 },
  bottomLabelActive: { color: theme.blue, fontWeight: '700' },
});
