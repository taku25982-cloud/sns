import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createPostSchema, eventCodes } from '@track-social/contracts';
import { apiRequest } from '../lib/auth-client';
import { PrimaryButton } from '../ui/PrimaryButton';
import { theme } from '../ui/theme';

type Profile = { id: string; displayName: string; isPrivate: boolean; ageBand: string; onboardingComplete: boolean };
type Visibility = 'public' | 'followers';
const draftKey = (id: string) => `track_social_post_draft_${id}`;
const leaveComposer = () => router.canGoBack() ? router.back() : router.replace('/home');

async function readDraft(key: string) {
  return Platform.OS === 'web' ? window.localStorage.getItem(key) : SecureStore.getItemAsync(key);
}

async function writeDraft(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } else if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

export default function ComposeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileState, setProfileState] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading');
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('followers');
  const [eventTag, setEventTag] = useState<(typeof eventCodes)[number] | null>(null);
  const [showEvents, setShowEvents] = useState(false);
  const [showAudience, setShowAudience] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const key = draftKey(profile?.id ?? 'preview');
  const publicAllowed = profileState === 'ready' && !profile?.isPrivate && profile?.ageBand !== '13-15';
  const canPublish = profileState === 'ready' && !submitting && createPostSchema.safeParse({ text, visibility, eventTag }).success;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let currentProfile: Profile | null = null;
      let state: typeof profileState = 'unavailable';
      try {
        const response = await apiRequest('/v1/me');
        if (response.ok) {
          const result = await response.json() as Partial<Profile>;
          if (result.onboardingComplete && result.id && result.displayName && typeof result.isPrivate === 'boolean' && result.ageBand) {
            currentProfile = result as Profile;
            state = 'ready';
          }
        } else if (response.status !== 401 && response.status !== 403) state = 'error';
      } catch (cause) {
        if (!(cause instanceof Error && ['api_not_configured', 'authentication_required'].includes(cause.message))) state = 'error';
      }
      try {
        const saved = await readDraft(draftKey(currentProfile?.id ?? 'preview'));
        if (saved && !cancelled) {
          const draft = JSON.parse(saved) as { text?: unknown; visibility?: unknown; eventTag?: unknown };
          if (typeof draft.text === 'string' && draft.text.length <= 500) setText(draft.text);
          if (draft.visibility === 'public' && state === 'ready' && !currentProfile?.isPrivate && currentProfile?.ageBand !== '13-15') setVisibility('public');
          if (draft.eventTag === null || eventCodes.includes(draft.eventTag as (typeof eventCodes)[number])) setEventTag(draft.eventTag as (typeof eventCodes)[number] | null);
        }
      } catch { /* A damaged local draft should not block the composer. */ }
      if (!cancelled) {
        setProfile(currentProfile);
        setProfileState(state);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const saveDraft = async () => {
    try {
      await writeDraft(key, JSON.stringify({ text, visibility, eventTag }));
      leaveComposer();
    } catch {
      setError('下書きを保存できませんでした。もう一度お試しください。');
      setShowExit(false);
    }
  };

  const discard = async () => {
    try {
      await writeDraft(key, null);
      leaveComposer();
    } catch {
      setError('下書きを削除できませんでした。もう一度お試しください。');
      setShowExit(false);
    }
  };

  const close = () => {
    if (text.trim() || eventTag) setShowExit(true);
    else leaveComposer();
  };

  const publish = async () => {
    const parsed = createPostSchema.safeParse({ text, visibility, eventTag });
    if (!parsed.success || !canPublish) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await apiRequest('/v1/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data),
      });
      if (response.status === 401) setError('ログインが必要です。');
      else if (response.status === 403) setError('現在のアカウント設定では、この公開範囲で投稿できません。');
      else if (!response.ok) setError('投稿できませんでした。下書きは画面に残っています。');
      else {
        setText('');
        try { await writeDraft(key, null); } catch { /* The post is already published. */ }
        router.replace('/home');
      }
    } catch {
      setError('通信に失敗しました。下書きは画面に残っています。');
    } finally {
      setSubmitting(false);
    }
  };

  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.header}>
      <Pressable onPress={close} accessibilityRole="button" style={styles.cancel}><Text style={styles.cancelText}>キャンセル</Text></Pressable>
      <Text style={styles.title}>新しい投稿</Text>
      <Pressable onPress={publish} disabled={!canPublish} accessibilityRole="button" accessibilityState={{ disabled: !canPublish }} style={[styles.topPublish, !canPublish && styles.disabled]}><Text style={styles.topPublishText}>投稿</Text></Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.authorRow}>
        <View style={styles.avatar}><Ionicons name="person-outline" size={25} color={theme.blue} /></View>
        <View style={styles.authorCopy}>
          <Text style={styles.authorName}>{profile?.displayName ?? 'ログイン後に表示'}</Text>
          <Text style={styles.audienceSummary}>{visibility === 'public' ? '公開' : 'フォロワーのみ'}</Text>
        </View>
        {profileState === 'loading' ? <ActivityIndicator color={theme.blue} /> : null}
      </View>
      <View style={styles.editor}>
        <TextInput value={text} onChangeText={setText} editable={profileState !== 'loading' && !submitting} multiline maxLength={500} placeholder="今なにしてる？" placeholderTextColor="#8C96AA" style={styles.input} accessibilityLabel="投稿本文" textAlignVertical="top" />
        <Text style={styles.counter}>{text.length}/500</Text>
      </View>
      <View style={styles.mediaPlaceholder}><Ionicons name="add" size={35} color={theme.blue} /><Text style={styles.mediaLabel}>写真・動画は準備中</Text></View>
      <Pressable onPress={() => setShowEvents((value) => !value)} accessibilityRole="button" style={styles.optionRow}>
        <Ionicons name="walk-outline" size={25} color={theme.navy} /><Text style={styles.optionLabel}>種目を追加（任意）</Text><Text style={styles.optionValue}>{eventTag ?? '選択する'}</Text><Ionicons name="chevron-forward" size={20} color={theme.muted} />
      </Pressable>
      {showEvents ? <View style={styles.choices}>{eventCodes.map((code) => <Pressable key={code} onPress={() => { setEventTag(code); setShowEvents(false); }} accessibilityRole="button" style={[styles.chip, eventTag === code && styles.chipSelected]}><Text style={[styles.chipText, eventTag === code && styles.chipTextSelected]}>{code}</Text></Pressable>)}<Pressable onPress={() => { setEventTag(null); setShowEvents(false); }} accessibilityRole="button" style={styles.chip}><Text style={styles.chipText}>指定しない</Text></Pressable></View> : null}
      <View style={styles.optionRow}><Ionicons name="pricetag-outline" size={25} color={theme.navy} /><Text style={styles.optionLabel}>ハッシュタグを追加（任意）</Text><Text style={styles.optionValue}>準備中</Text></View>
      <Pressable onPress={() => setShowAudience((value) => !value)} accessibilityRole="button" style={styles.optionRow}><Ionicons name="globe-outline" size={25} color={theme.navy} /><Text style={styles.optionLabel}>公開範囲</Text><Text style={styles.optionValue}>{visibility === 'public' ? '公開' : 'フォロワーのみ'}</Text><Ionicons name="chevron-forward" size={20} color={theme.muted} /></Pressable>
      {showAudience ? <View style={styles.audienceChoices}>
        <Pressable onPress={() => { setVisibility('followers'); setShowAudience(false); }} accessibilityRole="button" style={styles.audienceChoice}><Text style={styles.audienceText}>フォロワーのみ</Text></Pressable>
        <Pressable onPress={() => { if (publicAllowed) { setVisibility('public'); setShowAudience(false); } }} disabled={!publicAllowed} accessibilityRole="button" accessibilityState={{ disabled: !publicAllowed }} style={styles.audienceChoice}><Text style={[styles.audienceText, !publicAllowed && styles.muted]}>公開{!publicAllowed ? '（現在は選択できません）' : ''}</Text></Pressable>
      </View> : null}
      {profileState === 'unavailable' ? <Text style={styles.notice}>ログインと初期設定が完了すると投稿できます。入力した内容は下書きに保存できます。</Text> : null}
      {profileState === 'error' ? <Text style={styles.notice}>アカウント情報を確認できません。接続を確認してください。</Text> : null}
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      {showExit ? <View style={styles.exitBox}><Text style={styles.exitTitle}>下書きをどうしますか？</Text><Pressable onPress={saveDraft} accessibilityRole="button" style={styles.exitAction}><Text style={styles.exitActionText}>下書きを保存</Text></Pressable><Pressable onPress={discard} accessibilityRole="button" style={styles.exitAction}><Text style={styles.error}>破棄する</Text></Pressable><Pressable onPress={() => setShowExit(false)} accessibilityRole="button" style={styles.exitAction}><Text style={styles.exitActionText}>編集を続ける</Text></Pressable></View> : null}
      <View style={styles.bottomAction}><PrimaryButton label="投稿" onPress={publish} disabled={!canPublish} loading={submitting} /></View>
    </ScrollView>
    <View style={styles.bottomBar}>
      <Pressable onPress={() => router.replace('/home')} accessibilityRole="button" style={styles.bottomTab}><Ionicons name="home-outline" size={25} color={theme.muted} /><Text style={styles.bottomLabel}>ホーム</Text></Pressable>
      <View style={styles.bottomTab}><Ionicons name="search-outline" size={25} color={theme.muted} /><Text style={styles.bottomLabel}>さがす</Text></View>
      <View style={styles.bottomTab}><Ionicons name="add-circle" size={27} color={theme.blue} /><Text style={styles.activeBottomLabel}>投稿</Text></View>
      <View style={styles.bottomTab}><Ionicons name="notifications-outline" size={25} color={theme.muted} /><Text style={styles.bottomLabel}>通知</Text></View>
      <View style={styles.bottomTab}><Ionicons name="person-outline" size={25} color={theme.muted} /><Text style={styles.bottomLabel}>マイページ</Text></View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  header: { height: 68, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: theme.border },
  cancel: { minWidth: 92, minHeight: 44, justifyContent: 'center' },
  cancelText: { color: theme.blue, fontSize: 16, fontWeight: '600' },
  title: { color: theme.navy, fontSize: 21, fontWeight: '800' },
  topPublish: { minWidth: 64, minHeight: 44, borderRadius: 11, backgroundColor: theme.blue, alignItems: 'center', justifyContent: 'center' },
  topPublishText: { color: 'white', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  authorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.paleBlue, alignItems: 'center', justifyContent: 'center' },
  authorCopy: { flex: 1 },
  authorName: { color: theme.navy, fontSize: 17, fontWeight: '700' },
  audienceSummary: { color: theme.muted, fontSize: 13, marginTop: 3 },
  editor: { borderWidth: 1, borderColor: '#D5DEEC', borderRadius: 12, minHeight: 150, padding: 14 },
  input: { flex: 1, minHeight: 110, color: theme.text, fontSize: 17, lineHeight: 25 },
  counter: { color: theme.muted, fontSize: 12, textAlign: 'right' },
  mediaPlaceholder: { height: 126, borderWidth: 1, borderStyle: 'dashed', borderColor: '#BFCDE3', borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 18, backgroundColor: theme.canvas },
  mediaLabel: { color: theme.blue, fontSize: 14, fontWeight: '600' },
  optionRow: { minHeight: 58, borderTopWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLabel: { flex: 1, color: theme.navy, fontSize: 15, fontWeight: '600' },
  optionValue: { color: theme.muted, fontSize: 13 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 },
  chip: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  chipSelected: { backgroundColor: theme.paleBlue, borderColor: theme.blue },
  chipText: { color: theme.navy, fontSize: 13 },
  chipTextSelected: { color: theme.blue, fontWeight: '700' },
  audienceChoices: { backgroundColor: theme.canvas, borderRadius: 12, paddingHorizontal: 12 },
  audienceChoice: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderColor: theme.border },
  audienceText: { color: theme.navy, fontSize: 14 },
  muted: { color: theme.muted },
  notice: { backgroundColor: theme.paleBlue, borderRadius: 10, padding: 12, color: theme.navy, fontSize: 13, lineHeight: 20, marginTop: 18 },
  error: { color: '#C63535', fontSize: 13, lineHeight: 20 },
  exitBox: { backgroundColor: theme.canvas, borderRadius: 12, padding: 14, marginTop: 18 },
  exitTitle: { color: theme.navy, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  exitAction: { minHeight: 44, justifyContent: 'center' },
  exitActionText: { color: theme.blue, fontSize: 15, fontWeight: '600' },
  bottomAction: { marginTop: 22 },
  bottomBar: { height: 66, borderTopWidth: 1, borderColor: theme.border, flexDirection: 'row', backgroundColor: 'white' },
  bottomTab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  bottomLabel: { color: theme.muted, fontSize: 11 },
  activeBottomLabel: { color: theme.blue, fontSize: 11, fontWeight: '700' },
});
