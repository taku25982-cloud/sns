import { StyleSheet, Text, View } from 'react-native';
import { PreviewNotice, SafetyScreen } from '../ui/SafetyScreen';
import { theme } from '../ui/theme';

export default function DeleteAccountScreen() {
  return <SafetyScreen title="アカウントを削除">
    <Text style={styles.intro}>削除を申し込む前に、データの扱いをご確認ください。</Text>
    <View style={styles.card}>
      <Text style={styles.heading}>申請するとすぐに非表示になります</Text>
      <Text style={styles.body}>プロフィールと投稿は、ほかの人から見られなくなります。投稿機能や交流機能も利用できなくなります。</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.heading}>30日以内なら取り消せます</Text>
      <Text style={styles.body}>申請後もログインして、削除を取り消せます。期限を過ぎると取り消せません。</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.heading}>一部の記録は残る場合があります</Text>
      <Text style={styles.body}>相手側の会話表示や、通報の調査に必要な記録の扱いは、公開前に確定するプライバシーポリシーでご案内します。</Text>
    </View>
    <PreviewNotice>削除申請・取消の操作は準備中です。ここでは説明のみ確認できます。</PreviewNotice>
  </SafetyScreen>;
}

const styles = StyleSheet.create({
  intro: { color: theme.muted, fontSize: 15, lineHeight: 23, marginBottom: 20 },
  card: { backgroundColor: theme.canvas, borderRadius: 14, padding: 18, marginBottom: 12 },
  heading: { color: theme.navy, fontSize: 17, fontWeight: '700', lineHeight: 25, marginBottom: 8 },
  body: { color: theme.muted, fontSize: 14, lineHeight: 22 },
});
