import { StyleSheet, Text, View } from 'react-native';
import { PreviewNotice, SafetyRow, SafetyScreen, SafetySection } from '../ui/SafetyScreen';
import { theme } from '../ui/theme';

export default function PrivacyScreen() {
  return <SafetyScreen title="プライバシーと安全">
    <Text style={styles.intro}>公開範囲やメッセージの受信を管理します。</Text>
    <SafetySection title="アカウントのプライバシー">
      <SafetyRow label="非公開アカウント" value="オン（プレビュー）" />
      <SafetyRow label="メッセージ受信範囲" value="フォロワーのみ" />
      <SafetyRow label="コメント制限" value="全員" />
    </SafetySection>
    <SafetySection title="安全管理">
      <SafetyRow label="ブロックしたユーザー" value="準備中" />
      <SafetyRow label="ミュートしたユーザー" value="準備中" />
    </SafetySection>
    <View style={styles.teenBox}>
      <Text style={styles.teenTitle}>未成年の安全設定</Text>
      <Text style={styles.teenText}>年齢に応じた非公開設定と接触制限は、ログイン後にサーバー側で適用します。この画面では変更できません。</Text>
    </View>
    <PreviewNotice />
  </SafetyScreen>;
}

const styles = StyleSheet.create({
  intro: { color: theme.muted, fontSize: 14, marginTop: -10, marginBottom: 23 },
  teenBox: { padding: 16, backgroundColor: theme.canvas, borderRadius: 14, marginBottom: 12 },
  teenTitle: { color: theme.navy, fontSize: 16, fontWeight: '700', marginBottom: 7 },
  teenText: { color: theme.muted, fontSize: 13, lineHeight: 21 },
});
