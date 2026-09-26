import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '../ui/Brand';
import { PrimaryButton } from '../ui/PrimaryButton';
import { theme } from '../ui/theme';

const events = [
  { code: '100m', label: '100m', image: require('../../assets/events/sprint.png') },
  { code: '200m', label: '200m', image: require('../../assets/events/sprint.png') },
  { code: '400m', label: '400m', image: require('../../assets/events/sprint.png') },
  { code: '5000m', label: '長距離', image: require('../../assets/events/sprint.png') },
  { code: 'long_jump', label: '跳躍', image: require('../../assets/events/jump.png') },
  { code: 'shot_put', label: '投擲', image: require('../../assets/events/throw.png') },
  { code: 'hurdles', label: 'ハードル', image: require('../../assets/events/jump.png') },
];

export default function OnboardingPreview() {
  const [step, setStep] = useState(0);
  const [birthDate, setBirthDate] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [error, setError] = useState('');

  const next = () => {
    setError('');
    if (step === 0) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
      const date = match && new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      if (!match || !date || date.getUTCFullYear() !== Number(match[1]) || date.getUTCMonth() !== Number(match[2]) - 1 || date.getUTCDate() !== Number(match[3])) {
        setError('生年月日を YYYY-MM-DD 形式で入力してください。');
        return;
      }
      const todayParts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const part = (type: string) => Number(todayParts.find((value) => value.type === type)?.value);
      const age = part('year') - Number(match[1]) - (part('month') < Number(match[2]) || (part('month') === Number(match[2]) && part('day') < Number(match[3])) ? 1 : 0);
      if (age > 120) {
        setError('生年月日を確認してください。');
        return;
      }
      if (age < 13) {
        setError('13歳未満の方は登録できません。');
        return;
      }
    }
    if (step === 1 && (!displayName.trim() || !/^[a-z0-9_]{3,20}$/.test(username))) {
      setError('表示名と、英数字・_ の3〜20文字のユーザー名を入力してください。');
      return;
    }
    if (step === 2 && selectedEvents.length === 0) {
      setError('好きな種目を1つ以上選んでください。');
      return;
    }
    setStep((value) => Math.min(value + 1, 3));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="戻る" onPress={() => step === 0 ? router.back() : setStep(step - 1)} style={styles.back}>
            <Ionicons name="chevron-back" size={25} color={theme.navy} />
          </Pressable>
          <Brand compact />
          <View style={styles.back} />
        </View>
        <Text style={styles.tagline}>走る、跳ぶ、投げる。{`\n`}すべての陸上競技ファンのために。</Text>
        <View style={styles.steps}>
          {['生年月日', 'プロフィール', '好きな種目'].map((label, index) => (
            <View key={label} style={styles.step}>
              <View style={[styles.stepCircle, index <= step && styles.stepCircleActive]}><Text style={[styles.stepNumber, index <= step && styles.stepNumberActive]}>{index + 1}</Text></View>
              <Text style={[styles.stepLabel, index === step && styles.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        {step === 0 ? (
          <View style={styles.form}>
            <Text style={styles.heading}>生年月日を教えてください</Text>
            <Text style={styles.description}>年齢に合った安全設定のために使います。プロフィールには表示されません。</Text>
            <Text style={styles.fieldLabel}>生年月日</Text>
            <TextInput value={birthDate} onChangeText={setBirthDate} placeholder="例：2008-04-01" keyboardType="numbers-and-punctuation" autoComplete="birthdate-full" style={styles.input} accessibilityLabel="生年月日" />
          </View>
        ) : null}
        {step === 1 ? (
          <View style={styles.form}>
            <Text style={styles.heading}>プロフィールを作成</Text>
            <Text style={styles.description}>ほかの人に表示される名前を決めましょう。</Text>
            <Text style={styles.fieldLabel}>表示名</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} placeholder="例：山田 太郎" maxLength={40} style={styles.input} accessibilityLabel="表示名" />
            <Text style={styles.fieldLabel}>ユーザー名</Text>
            <TextInput value={username} onChangeText={(value) => setUsername(value.toLowerCase())} placeholder="例：track_runner" autoCapitalize="none" maxLength={20} style={styles.input} accessibilityLabel="ユーザー名" />
            <Text style={styles.hint}>英小文字・数字・_ が使えます。空き状況は認証接続後に確認します。</Text>
          </View>
        ) : null}
        {step === 2 ? (
          <View style={styles.form}>
            <Text style={styles.heading}>好きな種目を選んでください</Text>
            <Text style={styles.description}>興味のある種目を選ぶと、関連する投稿やユーザーを見つけやすくなります。</Text>
            <View style={styles.eventGrid}>
              {events.map((event) => {
                const selected = selectedEvents.includes(event.code);
                return (
                  <Pressable key={event.code} accessibilityRole="checkbox" accessibilityLabel={event.label} accessibilityState={{ checked: selected }} onPress={() => setSelectedEvents(selected ? selectedEvents.filter((value) => value !== event.code) : [...selectedEvents, event.code])} style={[styles.eventCard, selected && styles.eventCardSelected]}>
                    <ImageBackground source={event.image} resizeMode="cover" style={styles.eventImage} imageStyle={styles.eventImageCorners}>
                      <View style={styles.eventShade} />
                      <View style={styles.eventCheck}>{selected ? <Ionicons name="checkmark-circle" size={23} color={theme.blue} /> : <Ionicons name="ellipse-outline" size={23} color="white" />}</View>
                      <Text style={styles.eventCardText}>{event.label}</Text>
                    </ImageBackground>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
        {step === 3 ? (
          <View style={styles.complete}>
            <Ionicons name="checkmark-circle-outline" size={66} color={theme.blue} />
            <Text style={styles.heading}>入力内容を確認しました</Text>
            <Text style={styles.description}>実際の登録はApple / Googleログインと規約の準備後に利用できます。</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
        <View style={styles.footer}>
          {step < 3 ? <PrimaryButton label="次へ" onPress={next} /> : <PrimaryButton label="ログイン画面へ" onPress={() => router.replace('/')} />}
          <Text style={styles.previewNote}>開発プレビューです。入力内容は保存されません。</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  content: { flexGrow: 1, width: '100%', paddingHorizontal: 22, paddingBottom: 25 },
  top: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, justifyContent: 'center' },
  tagline: { textAlign: 'center', color: theme.muted, fontSize: 14, lineHeight: 23, marginTop: 6 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 34 },
  step: { flex: 1, alignItems: 'center', gap: 7 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDEFF4', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: theme.blue },
  stepNumber: { color: '#6E7890', fontSize: 16, fontWeight: '700' },
  stepNumberActive: { color: 'white' },
  stepLabel: { color: theme.muted, fontSize: 11 },
  stepLabelActive: { color: theme.blue, fontWeight: '700' },
  form: { flex: 1 },
  heading: { color: theme.navy, fontSize: 26, fontWeight: '800', lineHeight: 36 },
  description: { color: theme.muted, fontSize: 15, lineHeight: 24, marginTop: 10, marginBottom: 28 },
  fieldLabel: { color: theme.navy, fontSize: 14, fontWeight: '700', marginBottom: 9 },
  input: { height: 54, borderWidth: 1, borderColor: '#D9E0EB', borderRadius: 12, paddingHorizontal: 15, color: theme.text, fontSize: 16, marginBottom: 22 },
  hint: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: -10 },
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  eventCard: { width: '23%', height: 110, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  eventCardSelected: { borderColor: theme.blue },
  eventImage: { flex: 1, justifyContent: 'space-between' },
  eventImageCorners: { borderRadius: 9, width: '100%', height: '100%' },
  eventShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4, 18, 48, 0.28)' },
  eventCheck: { alignItems: 'flex-end', padding: 5 },
  eventCardText: { color: 'white', fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 10, textShadowColor: '#15223D', textShadowRadius: 4 },
  complete: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  error: { color: '#B42318', fontSize: 13, marginBottom: 10 },
  footer: { marginTop: 'auto', gap: 13 },
  previewNote: { color: theme.muted, fontSize: 11, textAlign: 'center' },
});
