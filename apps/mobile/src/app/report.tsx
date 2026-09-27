import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../ui/PrimaryButton';
import { PreviewNotice, SafetyScreen } from '../ui/SafetyScreen';
import { theme } from '../ui/theme';

const reasons = ['スパム', '嫌がらせ', '不適切な画像・動画', 'なりすまし', '危険な行為', '未成年に関する懸念', 'その他'] as const;

export default function ReportScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState(false);

  return <SafetyScreen title="通報">
    <Text style={styles.intro}>問題の内容に一番近い理由を選んでください。</Text>
    <View style={styles.reasons}>
      {reasons.map((reason) => <Pressable key={reason} onPress={() => { setSelected(reason); setPreviewed(false); }} accessibilityRole="radio" accessibilityState={{ selected: selected === reason }} style={styles.reason}>
        <Text style={styles.reasonText}>{reason}</Text>
        <Ionicons name={selected === reason ? 'radio-button-on' : 'radio-button-off'} size={23} color={selected === reason ? theme.blue : '#A5AEBD'} />
      </Pressable>)}
    </View>
    <PreviewNotice>開発プレビューです。通報は送信されません。実際の通報には対象の投稿またはアカウントとログインが必要です。</PreviewNotice>
    {previewed && <Text style={styles.feedback}>選択した理由: {selected}。通報は送信されていません。</Text>}
    <View style={styles.button}><PrimaryButton label="次へ（プレビュー）" disabled={!selected} onPress={() => setPreviewed(true)} /></View>
  </SafetyScreen>;
}

const styles = StyleSheet.create({
  intro: { color: theme.muted, fontSize: 14, marginTop: -10, marginBottom: 18 },
  reasons: { borderRadius: 14, backgroundColor: theme.canvas, paddingHorizontal: 5 },
  reason: { minHeight: 57, backgroundColor: 'white', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reasonText: { color: theme.navy, fontSize: 16, fontWeight: '600' },
  feedback: { color: theme.navy, fontSize: 13, lineHeight: 20, marginTop: 14 },
  button: { marginTop: 24 },
});
