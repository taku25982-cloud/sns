import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { registrationStatusSchema } from '@track-social/contracts';
import { Brand } from '../ui/Brand';
import { theme } from '../ui/theme';
import { apiBaseURL } from '../lib/auth-client';

export default function LoginScreen() {
  const [notice, setNotice] = useState('');
  const showNotice = async () => {
    let message = 'ログインの設定中です。現在はアカウントを作成できません。';
    if (apiBaseURL) {
      try {
        const response = await fetch(`${apiBaseURL}/v1/registration/status`);
        if (response.ok) {
          const status = registrationStatusSchema.parse(await response.json());
          message = status.enabled
            ? '登録受付は有効ですが、Apple・Googleログインはまだ接続されていません。'
            : '現在、新規登録を受け付けていません。';
        } else {
          message = '登録受付の状態を確認できませんでした。';
        }
      } catch {
        message = 'APIに接続できませんでした。開発用の接続先を確認してください。';
      }
    }
    setNotice(message);
    if (Platform.OS !== 'web') Alert.alert('準備中', message);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.mark}><Ionicons name="footsteps-outline" size={36} color={theme.blue} /></View>
          <Brand />
          <Text style={styles.tagline}>走る、跳ぶ、投げる。{`\n`}陸上をもっと楽しもう。</Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.heading}>陸上の仲間とつながろう</Text>
          <Text style={styles.description}>競技の記録や練習の日々を、自分らしく共有できる場所。</Text>
          <Pressable accessibilityRole="button" onPress={showNotice} style={[styles.provider, styles.apple]}>
            <Ionicons name="logo-apple" size={23} color="white" />
            <Text style={[styles.providerText, styles.appleText]}>Appleで続ける</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={showNotice} style={styles.provider}>
            <Ionicons name="logo-google" size={22} color={theme.blue} />
            <Text style={styles.providerText}>Googleで続ける</Text>
          </Pressable>
          {notice ? <Text style={styles.notice} accessibilityRole="alert">{notice}</Text> : null}
          <Text style={styles.legal}>利用規約とプライバシーポリシーは、登録開始前に提示します。</Text>
          {__DEV__ ? (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>開発プレビュー</Text>
              <Link href="/home" style={styles.previewText}>ホーム画面を見る</Link>
              <Link href="/onboarding" style={styles.previewText}>初期設定画面を見る</Link>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  content: { flexGrow: 1, width: '100%', paddingHorizontal: 24, justifyContent: 'space-between' },
  hero: { alignItems: 'center', paddingTop: 82, gap: 16 },
  mark: { width: 74, height: 74, borderRadius: 24, backgroundColor: theme.paleBlue, alignItems: 'center', justifyContent: 'center' },
  tagline: { color: theme.muted, fontSize: 18, textAlign: 'center', lineHeight: 29, marginTop: 4 },
  bottom: { paddingTop: 32, paddingBottom: 22, gap: 13 },
  heading: { color: theme.navy, fontSize: 25, fontWeight: '800', textAlign: 'center' },
  description: { color: theme.muted, fontSize: 15, lineHeight: 23, textAlign: 'center', marginBottom: 12 },
  provider: { minHeight: 56, borderRadius: 14, borderWidth: 1, borderColor: '#D9E0EB', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  apple: { backgroundColor: '#101828', borderColor: '#101828' },
  providerText: { color: theme.navy, fontSize: 16, fontWeight: '700' },
  appleText: { color: 'white' },
  notice: { color: theme.blue, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  legal: { color: theme.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 8 },
  preview: { borderTopWidth: 1, borderColor: theme.border, marginTop: 12, paddingTop: 12, alignItems: 'center', gap: 4 },
  previewLabel: { color: theme.muted, fontSize: 11 },
  previewText: { color: theme.blue, fontSize: 13, fontWeight: '600', paddingVertical: 14 },
});
