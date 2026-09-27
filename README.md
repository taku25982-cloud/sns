# 陸上SNS（仮称）

陸上競技者向けSNSの開発リポジトリです。正式名称は未決定です。仕様は `docs/01`〜`docs/03`、実装計画は `docs/04_implementation_plan.md` を参照してください。

## 現在の状態

フェーズ1の実装中です。認証・年齢制限・フォロー・通報のAPI基盤と、ログイン・初期設定・ホーム空状態のExpo画面があります。画面は開発プレビューで、認証とAPIへの接続、投稿表示、参照画像との最終比較は未完了です。登録は初期状態で無効で、外部公開は行っていません。

## ローカル起動

Node.js 22を使用します。

```powershell
npm ci
npm run types -w @track-social/api
npm run typecheck
npm run db:migrate -w @track-social/db
npm run dev:api
```

別のターミナルで `npm run dev:mobile` を実行します。ブラウザで画面を見る場合は `npm run web -w @track-social/mobile` を使用します。API確認先は `http://127.0.0.1:8787/v1/health` です。ローカルWorkerには `apps/api/.dev.vars.development` に `TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL` を設定します。DB migrationは接続先を設定しない場合 `packages/db/local.db` に適用されます。秘密情報とローカルDBはGit管理されません。

## 外部サービス

開発用Turso DBを接続済みです。staging / productionのDBと認証情報は未設定です。Apple / Google OAuthの設定後に実機ログインを確認します。接続情報と秘密情報はリポジトリへ保存しません。

モバイルのAPI接続先は `apps/mobile/.env.example` を参考に `apps/mobile/.env.local` の `EXPO_PUBLIC_API_URL` で設定します。iPhone実機ではPCのLAN内IPなど、端末から到達できるURLを使います。`EXPO_PUBLIC_` の値はアプリに公開されるため秘密情報を入れません。登録状態は `GET /v1/registration/status` で確認でき、現在は登録停止中です。OAuth認証情報と正式な規約・プライバシー文書が揃うまでログインボタンは有効化しません。
