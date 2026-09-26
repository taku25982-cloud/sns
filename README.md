# 陸上SNS（仮称）

陸上競技者向けSNSの開発リポジトリです。正式名称は未決定です。仕様は `docs/01`〜`docs/03`、実装計画は `docs/04_implementation_plan.md` を参照してください。

## 現在の状態

フェーズ1の初期実装中です。APIには認証基盤、年齢・同意を伴う登録完了、本人プロフィール取得、非公開設定を追加しました。登録は初期状態で無効です。Apple / Googleの認証情報、投稿、フィード、管理画面、参照画像に合わせたUIは未実装です。外部公開は行っていません。

## ローカル起動

Node.js 22を使用します。

```powershell
npm ci
npm run types -w @track-social/api
npm run typecheck
npm run db:migrate -w @track-social/db
npm run dev:api
```

別のターミナルで `npm run dev:mobile` を実行します。API確認先は `http://127.0.0.1:8787/v1/health` です。ローカルWorkerには `apps/api/.dev.vars.development` に `TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL` を設定します。DB migrationは接続先を設定しない場合 `packages/db/local.db` に適用されます。秘密情報とローカルDBはGit管理されません。

## 外部サービス

開発用Turso DBを接続済みです。staging / productionのDBと認証情報は未設定です。Apple / Google OAuthの設定後に実機ログインを確認します。接続情報と秘密情報はリポジトリへ保存しません。
