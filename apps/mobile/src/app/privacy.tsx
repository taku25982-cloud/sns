import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PreviewNotice, SafetyScreen } from '../ui/SafetyScreen';
import { theme } from '../ui/theme';

export default function PrivacyScreen() {
  return <SafetyScreen title="プライバシーと安全">
    <Text style={styles.intro}>安心して陸上を楽しめる環境をつくりましょう。</Text>
    <Text style={styles.groupTitle}>アカウントのプライバシー</Text>
    <PrivacyRow icon="lock-closed-outline" label="非公開アカウント" detail="あなたの投稿をフォロワーのみが閲覧できるようにします。" value="オン" />
    <PrivacyRow icon="mail-outline" label="メッセージ受信範囲" detail="メッセージを受け取れる人を設定します。" value="フォロワーのみ" />
    <PrivacyRow icon="chatbubble-outline" label="コメント制限" detail="コメントできる人を設定します。" value="全員" />
    <Text style={styles.groupTitle}>安全管理</Text>
    <PrivacyRow icon="ban-outline" label="ブロック済みアカウント" detail="ブロックしたアカウントを確認・管理します。" value="未接続" />
    <PrivacyRow icon="volume-mute-outline" label="ミュート中" detail="ミュートしているアカウントを確認・管理します。" value="未接続" />
    <Text style={styles.groupTitle}>安心して利用するために</Text>
    <PrivacyRow icon="people-outline" label="Teen設定" detail="13〜17歳には年齢に応じた安全設定が適用されます。" value="自動適用" />
    <PrivacyRow icon="shield-checkmark-outline" label="安全に関するお知らせ" detail="安全に利用するための案内を確認できます。" value="準備中" />
    <View style={styles.teenBox}><Text style={styles.teenTitle}>みんなでつくる、安心できる陸上コミュニティ</Text><Text style={styles.teenText}>不適切な投稿や行為を見つけた場合は、通報にご協力ください。</Text></View>
    <PreviewNotice />
  </SafetyScreen>;
}

function PrivacyRow({ icon, label, detail, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail: string; value: string }) {
  return <View style={styles.row}>
    <View style={styles.icon}><Ionicons name={icon} size={22} color={theme.navy} /></View>
    <View style={styles.copy}><Text style={styles.label}>{label}</Text><Text style={styles.detail}>{detail}</Text></View>
    <Text style={styles.value}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  intro: { color: theme.muted, fontSize: 14, marginTop: -10, marginBottom: 18 },
  groupTitle: { color: '#7C8BA8', fontSize: 15, fontWeight: '700', marginTop: 10, marginBottom: 5 },
  row: { minHeight: 75, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border, gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.paleBlue, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, paddingVertical: 8 },
  label: { color: theme.navy, fontSize: 15, fontWeight: '700' },
  detail: { color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  value: { color: theme.blue, fontSize: 12, maxWidth: 88, textAlign: 'right' },
  teenBox: { padding: 16, backgroundColor: theme.paleBlue, borderRadius: 14, marginTop: 15, marginBottom: 12 },
  teenTitle: { color: theme.blue, fontSize: 15, fontWeight: '700', marginBottom: 7 },
  teenText: { color: theme.muted, fontSize: 13, lineHeight: 21 },
});
