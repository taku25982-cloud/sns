import { router } from 'expo-router';
import { PreviewNotice, SafetyRow, SafetyScreen, SafetySection } from '../ui/SafetyScreen';

export default function SettingsScreen() {
  return <SafetyScreen title="設定">
    <SafetySection title="アカウント">
      <SafetyRow label="アカウント設定" value="準備中" />
      <SafetyRow label="プライバシー設定" onPress={() => router.push('/privacy')} />
      <SafetyRow label="DM設定" value="準備中" />
    </SafetySection>
    <SafetySection title="通知・安全">
      <SafetyRow label="通知設定" value="準備中" />
      <SafetyRow label="ブロックしたユーザー" value="準備中" />
      <SafetyRow label="通報する" onPress={() => router.push('/report')} />
    </SafetySection>
    <SafetySection title="その他">
      <SafetyRow label="応援プラン" value="準備中" />
      <SafetyRow label="よくある質問" value="準備中" />
      <SafetyRow label="ログアウト" value="ログイン未接続" danger />
    </SafetySection>
    <PreviewNotice />
  </SafetyScreen>;
}
