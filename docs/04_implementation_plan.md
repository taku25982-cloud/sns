# 04 実装計画

**対象:** 陸上SNS（仮称）  
**状態:** 実装前の計画  
**前提:** `01_product_requirements_and_architecture.md`、`02_ui_screen_spec.md`、`03_cold_start_rollout_operations.md` を正とする。

## 1. 現状と到達点

- 2026-09-26時点でローカルの `apps/sns` には仕様書とUI参照画像があり、Git管理・実装はない。
- GitHubの `taku25982-cloud/sns` は空の公開リポジトリ。初回実装時にローカル作業ディレクトリをGit管理し、remoteを接続する。
- 到達点はProduction-ready v1。公開は一人での検証から始め、Feature Flagで段階化する。知人・学校・招待先の協力を必要条件にしない。
- 初期対象は東京高校陸上に関心のある利用者を候補とする。niinaeさんへの相談は試用版と安全対応が整ってからの任意の集客策であり、協力を前提にしない。

## 2. 実装前の準備

1. `02_ui_screen_spec.md` が参照するUI画像一式は `docs/assets` に保存済み。元資料は `track_social_codex_final_embedded_images.zip`。画像内の誤記より仕様本文を優先する。
2. 各画像について、対象画面ID、基準端末サイズ、表示状態、画像・アイコン・フォント・色・余白を記録する。未掲載の状態（loading、empty、error、private、teen、restricted）は同じデザイン体系で定義する。
3. Expo、Better Auth、Turso、Cloudflare、RevenueCat等の現行仕様・対応関係・料金を各公式資料で実装直前に再確認する。未確認の価格や無料枠を予算に固定しない。
4. Apple / Google認証、EAS、Cloudflare、Turso、R2、Stream、PostHog、Sentry、RevenueCatの環境をdev / staging / productionで分離する。設定が必要な段階で利用可能なMCPを優先して使い、秘密情報はリポジトリに置かない。
5. 初期費用上限、重大通報を確認できる時間帯、アカウント削除後の保持期間、プライバシーポリシーを公開前に確定する。

## 3. 画面の完全再現の進め方

- UI画像をレイアウト、配色、タイポグラフィ、アイコン、画像、余白の基準とする。本文の画面遷移・文言要件・安全設定が画像と食い違う場合は本文を優先する。
- 画面を単なる画像として貼らず、Expo / React Nativeの操作可能なコンポーネントで再構成する。Dynamic Type、VoiceOver、44pt以上の操作領域、端末差分を維持する。
- 代表画面を先に実装してdesign tokenと共通部品を固め、その後に各画面へ展開する。共通部品の見た目を変えたら関連画面を再比較する。
- 各画面で参照画像と同じ表示幅・状態のスクリーンショットを撮り、重ね合わせまたは並列比較を行う。余白、文字サイズ、色、角丸、画像比率、アイコン位置、スクロール時の挙動を修正する。
- 「完全再現」は参照画像のapp-owned領域を対象とする。OSのステータスバー、キーボード、権限ダイアログは端末実装に従う。画像が示していない状態は本文仕様と同じデザイン体系で補う。
- 画像と見た目が合っていても、navigation、server-side権限、loading / empty / error、未成年・非公開状態が欠けていれば画面完了としない。

## 4. フェーズと完了条件

| フェーズ | 実装内容 | 完了条件 |
| --- | --- | --- |
| 0. 基盤 | Git / monorepo、Expo Router、Workers + Hono、Turso + Drizzle、共有API契約、環境分離、CI、server-side flags | dev / stagingで起動し、migrationとAPI疎通を再現できる。公開用の秘密情報がリポジトリにない |
| 1. 本人・安全の土台 | Better AuthのApple / Google、年齢・同意、onboarding、profile、private、follow request、block / mute、report、基本admin、監査ログ | 複数の検証用アカウントで13歳未満拒否、未成年初期非公開、非公開閲覧制御、通報から非表示・制限まで確認できる |
| 2. 投稿とフィード | R2直接upload、text / photo、draft、編集・削除、comment / like / save、following / recommended feed、cold start、探索、検索 | あるアカウントの投稿を権限がある別アカウントが閲覧でき、権限がないアカウントでは取得できない。フォロワー0の投稿も適合候補へ出る |
| 3. 通知・運営 | Queues、アプリ内通知、push、管理画面のreport / appeal / flags /費用表示、削除ジョブ、分析・エラー監視 | 通報を一人で処理でき、登録・DM・動画・広告をserver flagで止められる。削除と監査の結果を追跡できる |
| 4. 段階公開機能 | DM永続化とDurable Objects、未成年接触制限、Stream動画、RevenueCat応援プラン、広告・sprinq導線 | DM requestと成人・未成年制限、動画処理、購入・復元、webhookを検証できる。機能ごとに公開OFFへ戻せる |
| 5. 品質と公開準備 | UI画像比較、E2E、権限・abuse・費用・復旧確認、ストア提出物、利用規約・プライバシー文書 | `01` のDone Definitionと `02` のUI Definition of Doneを満たし、`03` のSolo Alphaへ進める |

各フェーズ終了時に「実装済み / 未実装 / 既知の問題 / 次フェーズ」を記録する。Production v1の機能を勝手に削らず、公開範囲はflagで分ける。

## 5. 一人での検証と段階公開

- Phase 1〜3は開発者一人で、dev / stagingの検証用アカウントと自動テストを使う。本番で架空のユーザーや架空の交流を作らない。
- Solo Alphaの出口は「登録 → 投稿 → 別アカウントで閲覧 → block / report → adminで非表示・制限 → 削除」の一連の確認。
- 最初の公開募集は登録上限を設け、投稿者数、初回feedの空表示率、D1 / D7、初週の交流率、重大通報の初回確認時間、月次費用見込みを観測する。
- 重大通報を24時間以内に初回確認できない場合や投稿が少なくfeedが偏る場合は、募集枠を広げない。公開募集の開始は「20件の候補」を偽装して満たさない。
- 収益化は無料の投稿・閲覧・交流が続くことを先に確認し、応援プラン、広告の順に限定試験する。少数ユーザー段階の収支計画に広告収入を算入しない。

## 6. 外部設定と接続順

1. GitHub remote、CI、環境別secrets。
2. Cloudflare Workers / R2 / Queues / Durable Objects / StreamとTurso。必要な機能のフェーズで順に有効化する。
3. Apple / Google認証とEASのアプリ識別子・署名・ビルド設定。
4. PostHog / SentryはPIIを送らない設定、RevenueCatは購入実装のフェーズで接続。

外部サービスの接続では、設定値と必要な権限を先に確認し、利用可能なMCPを使える場合はそれを利用する。課金プランの変更や本番公開は具体的な費用・影響が分かる状態で判断する。

## 7. 直近の作業

1. 参照画像と仕様本文の画面対応表を作る。
2. フェーズ0の構成と環境変数一覧を具体化する。
3. 空のGitHubリポジトリへ初回の基盤と仕様書・参照画像を載せ、以降はフェーズ単位で実装・確認する。
