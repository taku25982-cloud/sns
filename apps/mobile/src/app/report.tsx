import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../ui/PrimaryButton';
import { PreviewNotice, SafetyScreen } from '../ui/SafetyScreen';
import { theme } from '../ui/theme';

const reasons = [
  ['スパム', '広告・宣伝、繰り返しの投稿など', 'megaphone-outline'],
  ['嫌がらせ', '誹謗中傷、攻撃的な発言、いじめなど', 'thumbs-down-outline'],
  ['不適切な画像・動画', 'わいせつな内容、暴力的な表現など', 'image-outline'],
  ['なりすまし', '他の人になりすましたアカウント', 'person-outline'],
  ['危険な行為', '自傷行為、危険なチャレンジの助長など', 'warning-outline'],
  ['未成年に関する懸念', '未成年の安全を脅かす内容など', 'people-outline'],
  ['その他', '上記以外の問題', 'ellipsis-horizontal-outline'],
] as const;

export default function ReportScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState(false);

  return <SafetyScreen title="通報">
    <Text style={styles.intro}>この投稿やアカウントに関する問題を報告してください。より良い陸上SNSのためにご協力をお願いします。</Text>
    <View style={styles.reasons}>
      {reasons.map(([reason, detail, icon]) => <Pressable key={reason} onPress={() => { setSelected(reason); setPreviewed(false); }} accessibilityRole="radio" accessibilityState={{ selected: selected === reason }} style={styles.reason}>
        <Ionicons name={icon} size={26} color={theme.navy} style={styles.reasonIcon} />
        <View style={styles.reasonCopy}><Text style={styles.reasonText}>{reason}</Text><Text style={styles.reasonDetail}>{detail}</Text></View>
        <Ionicons name={selected === reason ? 'radio-button-on' : 'radio-button-off'} size={23} color={selected === reason ? theme.blue : '#66728F'} />
      </Pressable>)}
    </View>
    <PreviewNotice>開発プレビューです。通報は送信されません。実際の通報には対象の投稿またはアカウントとログインが必要です。</PreviewNotice>
    {previewed && <Text style={styles.feedback}>選択した理由: {selected}。通報は送信されていません。</Text>}
    <View style={styles.button}><PrimaryButton label="次へ（プレビュー）" disabled={!selected} onPress={() => setPreviewed(true)} /></View>
  </SafetyScreen>;
}

const styles = StyleSheet.create({
  intro: { color: theme.muted, fontSize: 14, lineHeight: 22, marginTop: -10, marginBottom: 18 },
  reasons: { gap: 8 },
  reason: { minHeight: 68, backgroundColor: 'white', borderWidth: 1, borderColor: theme.border, borderRadius: 11, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  reasonIcon: { width: 40 },
  reasonCopy: { flex: 1, paddingVertical: 7 },
  reasonText: { color: theme.navy, fontSize: 16, fontWeight: '600' },
  reasonDetail: { color: theme.muted, fontSize: 12, marginTop: 3 },
  feedback: { color: theme.navy, fontSize: 13, lineHeight: 20, marginTop: 14 },
  button: { marginTop: 24 },
});
