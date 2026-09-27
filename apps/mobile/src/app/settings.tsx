import { router } from 'expo-router';
import { PreviewNotice, SafetyRow, SafetyScreen, SafetySection } from '../ui/SafetyScreen';

export default function SettingsScreen() {
  return <SafetyScreen title="設定">
    <SafetySection title="アカウント">
      <SafetyRow label="アカウント設定" detail="プロフィールの編集・メールアドレス" icon="person-outline" value="準備中" />
    </SafetySection>
    <SafetySection title="プライバシー">
      <SafetyRow label="プライバシー設定" detail="非公開設定・検索での表示・ブロック" icon="lock-closed-outline" onPress={() => router.push('/privacy')} />
      <SafetyRow label="DM設定" detail="メッセージの受信設定" icon="chatbubble-outline" value="準備中" />
    </SafetySection>
    <SafetySection title="通知"><SafetyRow label="通知設定" detail="いいね・コメント・フォロー・DMの通知" icon="notifications-outline" value="準備中" /></SafetySection>
    <SafetySection title="安全">
      <SafetyRow label="ブロックしたユーザー" detail="ブロックリストの管理" icon="shield-outline" value="準備中" />
      <SafetyRow label="通報する" detail="問題のある投稿やアカウントを報告" icon="flag-outline" onPress={() => router.push('/report')} />
    </SafetySection>
    <SafetySection title="応援プラン"><SafetyRow label="応援プラン" detail="バッジ・限定機能・陸上をもっと楽しむ" icon="ribbon-outline" value="準備中" /></SafetySection>
    <SafetySection title="ヘルプ"><SafetyRow label="よくある質問" detail="使い方・トラブルシューティング" icon="help-circle-outline" value="準備中" /></SafetySection>
    <SafetySection title=""><SafetyRow label="ログアウト" detail="このアカウントからログアウトします" icon="log-out-outline" value="未接続" danger /></SafetySection>
    <PreviewNotice />
  </SafetyScreen>;
}
