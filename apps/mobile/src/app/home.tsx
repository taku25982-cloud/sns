import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { feedResponseSchema, type FeedPost } from '@track-social/contracts';
import { Brand } from '../ui/Brand';
import { theme } from '../ui/theme';
import { apiRequest } from '../lib/auth-client';

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
  const [feedState, setFeedState] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const requestEpoch = useRef(0);

  useEffect(() => {
    if (active !== 'ホーム') return;
    requestEpoch.current += 1;
    let cancelled = false;
    setFeedState('loading');
    setPosts([]);
    setNextCursor(null);
    setMoreError(false);
    const tab = feedTab === 'おすすめ' ? 'recommended' : 'following';
    apiRequest(`/v1/feed?tab=${tab}`).then(async (response) => {
      if (response.status === 401 || response.status === 403) {
        if (!cancelled) setFeedState('unavailable');
        return;
      }
      if (!response.ok) throw new Error('feed_request_failed');
      const feed = feedResponseSchema.parse(await response.json());
      if (!cancelled) {
        setPosts(feed.posts);
        setNextCursor(feed.nextCursor);
        setFeedState('ready');
      }
    }).catch((error: unknown) => {
      if (!cancelled) setFeedState(error instanceof Error && ['api_not_configured', 'authentication_required'].includes(error.message) ? 'unavailable' : 'error');
    });
    return () => { cancelled = true; requestEpoch.current += 1; };
  }, [active, feedTab, retryKey]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    const epoch = requestEpoch.current;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const tab = feedTab === 'おすすめ' ? 'recommended' : 'following';
      const response = await apiRequest(`/v1/feed?tab=${tab}&cursor=${encodeURIComponent(nextCursor)}`);
      if (!response.ok) throw new Error('feed_request_failed');
      const feed = feedResponseSchema.parse(await response.json());
      if (epoch === requestEpoch.current) {
        setPosts((current) => [...current, ...feed.posts]);
        setNextCursor(feed.nextCursor);
      }
    } catch {
      if (epoch === requestEpoch.current) setMoreError(true);
    } finally {
      if (epoch === requestEpoch.current) setLoadingMore(false);
    }
  };

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
          {feedState === 'ready' && posts.length ? (
            <ScrollView contentContainerStyle={styles.feedList}>
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
              {nextCursor ? <Pressable onPress={loadMore} disabled={loadingMore} accessibilityRole="button" style={styles.moreButton}>
                <Text style={styles.moreText}>{loadingMore ? '読み込み中...' : 'さらに表示'}</Text>
              </Pressable> : null}
              {moreError ? <Text style={styles.moreError}>続きを読み込めませんでした。もう一度お試しください。</Text> : null}
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.emptyFeed}>
              {feedState === 'loading' ? <ActivityIndicator size="large" color={theme.blue} /> : <View style={styles.emptyIcon}><Ionicons name="walk-outline" size={34} color={theme.blue} /></View>}
              <Text style={styles.emptyTitle}>{feedState === 'loading' ? '読み込み中です' : feedState === 'unavailable' ? 'ログイン後に投稿を表示します' : feedState === 'error' ? '投稿を読み込めませんでした' : feedTab === 'おすすめ' ? 'まだ投稿がありません' : 'フォロー中の投稿はありません'}</Text>
              <Text style={styles.emptyText}>{feedState === 'unavailable' ? '現在は開発プレビューです。ログインの接続後に実際の投稿が表示されます。' : feedState === 'error' ? '通信状態を確認して、もう一度お試しください。' : feedTab === 'おすすめ' ? '陸上の投稿が集まるまで、少しお待ちください。' : 'フォローした人の投稿が、ここに表示されます。'}</Text>
              {feedState === 'error' ? <Pressable onPress={() => setRetryKey((value) => value + 1)} accessibilityRole="button" style={styles.retryButton}><Text style={styles.moreText}>再試行</Text></Pressable> : null}
            </ScrollView>
          )}
        </>
      ) : active === 'マイページ' ? (
        <View style={styles.otherContent}>
          <Text style={styles.otherTitle}>マイページ</Text>
          <Text style={styles.emptyText}>開発プレビューです。アカウント情報はまだ表示できません。</Text>
          <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" style={styles.settingsLink}>
            <Ionicons name="settings-outline" size={22} color={theme.blue} />
            <Text style={styles.settingsText}>設定を開く</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.blue} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.otherContent}>
          <Text style={styles.otherTitle}>{active}</Text>
          <Text style={styles.emptyText}>この画面は準備中です。</Text>
        </View>
      )}
      <View style={styles.bottomBar} accessibilityRole="tablist">
        {tabs.map((tab) => (
          <Pressable key={tab.label} onPress={() => tab.label === '投稿' ? router.push('./compose') : setActive(tab.label)} accessibilityRole="tab" accessibilityState={{ selected: active === tab.label }} style={styles.bottomTab}>
            <Ionicons name={tab.icon} size={27} color={active === tab.label ? theme.blue : '#4C5569'} />
            <Text style={[styles.bottomLabel, active === tab.label && styles.bottomLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function PostCard({ post }: { post: FeedPost }) {
  return <View style={styles.postCard}>
    <View style={styles.postHeader}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{post.displayName.slice(0, 1)}</Text></View>
      <View style={styles.postAuthor}><Text style={styles.postName}>{post.displayName}</Text><Text style={styles.postHandle}>@{post.username}</Text></View>
      <Text style={styles.postDate}>{new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(new Date(post.createdAt))}</Text>
    </View>
    {post.eventTag ? <Text style={styles.eventTag}>{post.eventTag}</Text> : null}
    <Text style={styles.postText}>{post.text}</Text>
  </View>;
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
  feedList: { padding: 16, paddingBottom: 32, gap: 12 },
  postCard: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.paleBlue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.blue, fontSize: 18, fontWeight: '700' },
  postAuthor: { flex: 1 },
  postName: { color: theme.navy, fontSize: 15, fontWeight: '700' },
  postHandle: { color: theme.muted, fontSize: 12, marginTop: 2 },
  postDate: { color: theme.muted, fontSize: 12 },
  eventTag: { alignSelf: 'flex-start', backgroundColor: theme.paleBlue, color: theme.blue, fontSize: 12, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, marginTop: 14 },
  postText: { color: theme.text, fontSize: 15, lineHeight: 23, marginTop: 12 },
  moreButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: theme.blue, fontSize: 15, fontWeight: '700' },
  moreError: { color: theme.muted, fontSize: 13, textAlign: 'center' },
  retryButton: { marginTop: 20, minHeight: 48, justifyContent: 'center' },
  otherContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  otherTitle: { color: theme.navy, fontSize: 24, fontWeight: '700' },
  settingsLink: { width: '100%', marginTop: 26, minHeight: 56, borderRadius: 14, backgroundColor: theme.canvas, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsText: { flex: 1, color: theme.navy, fontSize: 16, fontWeight: '700' },
  bottomBar: { height: 68, borderTopWidth: 1, borderColor: theme.border, flexDirection: 'row', backgroundColor: 'white' },
  bottomTab: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bottomLabel: { color: '#5D6679', fontSize: 10 },
  bottomLabelActive: { color: theme.blue, fontWeight: '700' },
});
