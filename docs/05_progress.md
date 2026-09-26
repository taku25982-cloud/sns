# 実装状況

**更新:** 2026-09-26

## フェーズ0: 基盤

### 実装済み

- npm workspaces、Expo Routerのアプリ起動土台、Workers + HonoのAPI起動土台。
- development / staging / productionのWorker構成。
- Turso / Drizzle用のschemaと初回migration（feature flags、invite codes）。
- 型チェックとGitHub Actionsの検証設定。

### 未実装

- Better Auth、Apple / Googleログイン、ソーシャルグラフ、投稿、フィード、管理画面。
- Turso、R2、Stream、Queues等の外部リソース接続。
- 本番用のアプリ識別子、署名、ストア設定。
- UI参照画像の再現。現在のExpo画面は起動確認用。

### 既知の問題

- テンプレート由来のアイコンと未使用のデモ用ファイルが残っている。UI実装時に参照画像に合わせて置き換える。
- DB schemaは基盤用の2表だけ。本人・投稿等の表は対応機能を実装するフェーズで追加する。

### 次フェーズ

- Apple / Google認証の環境要件を確認し、Better Auth、年齢・同意、プロフィール、非公開設定、通報と管理画面の最小経路を実装する。
