# 陸上SNS（仮称）

陸上競技者向けSNSの開発リポジトリです。正式名称は未決定です。仕様は `docs/01`〜`docs/03`、実装計画は `docs/04_implementation_plan.md` を参照してください。

## 現在の状態

フェーズ0の土台です。Expoアプリの画面は開発用表示、Workers APIは `/v1/health` のみです。認証、投稿、フィード、管理画面はまだ実装していません。外部公開は行っていません。

## ローカル起動

Node.js 22を使用します。

```powershell
npm ci
npm run types -w @track-social/api
npm run typecheck
npm run db:migrate -w @track-social/db
npm run dev:api
```

別のターミナルで `npm run dev:mobile` を実行します。API確認先は `http://127.0.0.1:8787/v1/health` です。DB migrationは `packages/db/local.db` に適用され、このファイルはGit管理されません。

## 外部サービス

現時点ではCloudflareやTursoの本番環境に接続していません。`apps/api/wrangler.jsonc` のdevelopment / staging / productionは構成だけを分けた状態です。接続情報と秘密情報はリポジトリへ保存しません。
