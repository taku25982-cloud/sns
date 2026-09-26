# 01 Product Requirements + Technical Architecture

**Project:** 陸上SNS（仮称）  
**Status:** Canonical / Codex implementation source of truth  
**Version:** 2.0  
**Verified:** 2026-09-26  

> この文書は、陸上SNSのプロダクト要件と技術アーキテクチャの正式仕様である。過去の要件定義や会話に矛盾がある場合は、この文書を優先する。ブランド名は未決定のため、実装中は仮称または設定値で扱い、`TrackConnect` など過去のモック上の名称を正式名称として固定しない。

---

## 0. Codexへの最重要指示

- この文書、`02_ui_screen_spec.md`、`03_cold_start_rollout_operations.md` の3文書をすべて読んでから実装を開始する。
- 仕様を勝手にMVPへ縮小しない。Production-ready v1を実装し、公開はFeature Flagで段階化する。
- 不明点があっても合理的に解釈できる範囲では停止せず実装する。重大な矛盾、安全上の問題、外部サービス仕様の不確実性だけを明示する。
- 実装前にリポジトリ全体を監査し、現状との差分と実装計画を作る。
- 各フェーズ終了時に「実装済み / 未実装 / 既知の問題 / 次フェーズ」を更新する。
- ユーザー数・フォロワー数・PB・大会順位を理由に新規ユーザーが不利になる推薦を作らない。
- 未成年保護、通報、ブロック、非公開アカウント、DM制限を後回しにしない。
- コストを常に設計要件として扱う。N+1、過剰fetch、無制限preload、不要なrealtime同期を禁止する。

---

# 1. プロダクト概要

## 1.1 ビジョン

陸上競技者が「同じ競技をしている人とつながる」「競技の投稿を届ける」「新しい選手や練習・大会の投稿を発見する」ための、日本発の陸上競技特化SNSを作る。

## 1.2 Instagram/Xとは別に使う理由

1. ユーザーの中心が陸上競技者である。
2. 同じ種目・近い興味を持つ選手を見つけやすい。
3. 競技レベルに関係なく参加しやすい。
4. フォロワーが少なくても、興味が合う陸上ユーザーへ投稿が届く。

## 1.3 対象

- 初期: 日本国内。
- 対象競技: 短距離、中長距離、ハードル、跳躍、投てき、混成など全種目。
- 年齢: 13歳以上を前提とする。
- 初期獲得は密度を優先し、東京圏や既存の陸上コミュニティなどから始めてもよいが、プロダクト仕様は全国対応にする。

## 1.4 非目標

Production v1では次を必須にしない。

- Stories
- Live配信
- Group DM
- 高度な公式記録認証
- 大規模なイベント結果DB
- ML/LLMを使った推薦
- 専用検索クラスタ

将来拡張できる構造は確保する。

---

# 2. プロダクト原則

1. **投稿・閲覧・交流の核は無料。**
2. **フォロワー0でも適切な相手へ届く。**
3. **PB・記録・フォロワー数を主要ランキング要因にしない。**
4. **未成年保護を初期設計に含める。**
5. **不可逆な制裁は原則人間レビュー。**
6. **実装と公開を分離する。** 機能は完成させてもFeature FlagでOFFにできる。
7. **ユーザー密度と安全運用能力が成長速度を決める。**
8. **無料枠だけで選ばない。** 小規模は安く、成長時も滑らかに費用が増える構成を優先する。

---

# 3. Production v1 機能スコープ

## 3.1 アカウント / 認証

- Apple Sign in
- Google Sign in
- セッション継続
- ログアウト
- アカウント削除
- 自己申告の生年月日
- 13歳未満は登録不可
- 利用規約 / プライバシーポリシー同意

## 3.2 オンボーディング

順序:

1. 起動
2. Apple / Googleログイン
3. 生年月日
4. 表示名
5. username
6. 興味種目選択
7. おすすめユーザー
8. 任意で3〜10人フォロー
9. Home

プロフィール画像、PB、所属、自己紹介は必須にしない。

## 3.3 プロフィール

必須:
- display name
- username
- 興味 / 種目

任意:
- avatar
- bio
- 所属 / 学校 / チーム
- 都道府県
- 年代 / school stage
- PB

PBは自己申告。初期v1で公式認証しない。

## 3.4 投稿

- テキストのみ
- 写真
- 動画
- 写真は最大10枚を基準
- 動画は最大90秒 / 最大1080pを初期上限とする
- event tag 任意
- hashtag 任意
- 公開範囲: public / followers
- draft保存
- 投稿後編集: text / hashtag / event tag
- 投稿後のmedia差し替えはv1では不要
- 削除確認

## 3.5 Home

- `おすすめ`
- `フォロー中`
- 初期タブはおすすめ
- 新規投稿で現在位置を飛ばさない
- 新着時は「↑ 新しい投稿」を表示
- 復帰時のscroll positionを保持

## 3.6 交流

- like
- comment / reply
- save（非公開）
- share（アプリ内DM / iOS share sheet）
- follow / unfollow
- private accountへのfollow request
- mute / block / not interested / report

## 3.7 検索 / 発見

- username / display name
- posts
- hashtags
- event tags
- 種目別探索
- おすすめユーザー
- トレンド投稿

初期は専用検索エンジンを導入せず、DBインデックス + SQL検索で開始する。

## 3.8 DM

- 1対1のみ
- text / photo / video
- message request
- request承認前はmedia送信不可
- teensは受信範囲を厳しくする
- block / report
- read state
- typing / realtime deliveryは可能

Production v1では実装するが、公開は段階制。

## 3.9 通知

- like
- comment / reply
- follow
- follow request / accepted
- DM
- moderation / account notices

Pushとアプリ内通知の両方を持つ。

## 3.10 応援プラン

価格は**未決定**。UIモックにある価格を正式値としない。

候補特典:
- 広告非表示
- supporter badge
- 軽いプロフィールテーマ
- 新機能早期アクセス

無料ユーザーをfeed rankingで不利にしない。

## 3.11 広告

- native in-feed ad
- 広告と明示
- 強制interstitialを初期採用しない
- pre-rollを初期採用しない
- 初期公開時はOFF可能

## 3.12 sprinq連携

SNSの主目的を壊さない。

- 走行動画など文脈のある場面のみCTA
- 設定内の関連サービス
- feedをsprinq広告で埋めない

---

# 4. 年齢 / プライバシー / 未成年安全

## 4.1 年齢の扱い

生年月日は自己申告として扱う。強い本人確認・年齢保証を行っていると表現しない。

## 4.2 デフォルト公開範囲

- 13〜17歳: privateを初期値
- 18歳以上: publicを初期値

公開設定変更時は年齢に応じた安全確認を入れる。13〜15歳の公開化はv1では許可しない。16〜17歳の公開化は本人への影響説明を経た明示操作でのみ許可し、投稿ごとの公開範囲は別途確認する。18歳になっても既存のprivate設定を自動変更しない。

## 4.3 private account

follow承認前に公開してよいもの:
- avatar
- display name
- username
- bio
- event interests
- ユーザーが公開を選んだ最低限の項目

投稿 / mediaは非表示。

## 4.4 DM安全

- 13〜17歳へのDM開始は、受信者本人が送信者をフォローしている場合に限る。成人から未成年へのmessage requestは許可しない。未成年同士も同じ初期ルールとする。
- フォロー承認だけでDM送信権限は生じない。送信時・閲覧時に年齢、フォロー、ブロック、制裁、DM設定をserver-sideで再評価する。
- 18歳以上のrequest phaseではmedia不可。承認後のみmediaを許可する。
- block / reportを会話画面からすぐ利用可能にする。
- DM機能をアカウント単位で制限できる。
- 初期の外部公開では未成年を含むDMをflagでOFFにできる。開放はtextから段階的に行う。

## 4.5 位置・所属

- precise live locationは扱わない。
- 都道府県は任意。
- 学校 / チームは任意。
- 未成年プロフィールで所在地情報を強調しない。

---

# 5. Trust & Safety

## 5.1 報告対象

- 投稿
- コメント
- プロフィール
- ユーザー
- DM

## 5.2 原則

**通報件数だけで自動BANしない。**

流れ:

`report -> priority/triage -> human review -> enforcement -> appeal`

## 5.3 Enforcement

- L0: no action
- L1: warning / content removal
- L2: feature restriction
- L3: temporary suspension
- L4: permanent suspension

必要ならDMのみ停止など機能別制裁を優先する。

## 5.4 管理者画面

最低限:
- report queue
- report detail
- target content
- reporter / target history
- moderation action
- internal notes
- appeal queue
- audit log

## 5.5 Safety Capacity Rule

未処理の重大案件が蓄積する場合、登録やDM開放を拡大しない。Feature Flagで即時制限可能にする。

## 5.6 削除・調査記録の扱い

- 投稿削除は直ちにfeed / search / profileから非表示にし、media削除を非同期処理する。
- アカウント削除申請後は直ちにプロフィール・投稿を他ユーザーから非表示にし、30日以内の取消を可能にする。取消期間後、本人情報とmediaの削除・匿名化を開始する。
- 会話を自分の一覧から消す操作と、自分が送ったDMを双方から取り消す操作は区別する。アカウント削除後に相手側で残る会話表示もUIに明示する。
- 通報・異議申し立ての調査に必要な最小限の証拠と監査記録は、一般表示から分離してアクセスを制限する。保持対象、期間、削除条件は公開前にプライバシーポリシーと運用手順へ明記する。
- バックアップ、外部分析、配信キャッシュを含む削除完了条件を実装前に定義し、削除ジョブの失敗を監視する。

---

# 6. 推薦システム v1

LLM / 外部AI APIを使わない。

## 6.1 Pipeline

`candidate generation -> safety filter -> score -> diversity rerank -> ad insertion -> feed`

## 6.2 Candidate Sources

- follows
- same / related event
- hashtag / event affinity
- high-quality recent posts
- exploration
- new creators / low exposure creators

## 6.3 Signals

強いpositive:
- follow
- save
- comment
- full video watch
- rewatch

中:
- post detail open
- profile view
- long dwell

negative:
- quick skip
- not interested
- mute
- block
- report

## 6.4 初期scoreの考え方

`interest + author affinity + engagement quality + freshness + discovery + quality - negatives`

数値weightはconfig化し、コードに固定しない。

## 6.5 Diversity

- 同一作者の連続露出を制限
- exploration枠
- recent枠
- new / low-exposure creator枠
- followers onlyに偏らない

## 6.6 Cold Start

onboardingの興味種目と初回followで初期化し、行動が増えたら徐々に行動データを優先する。

---

# 7. 正式技術スタック

この章は2026-09-26時点の正式方針。外部サービス仕様・料金は実装直前に公式ドキュメントを再確認する。

## 7.1 Mobile

- **Expo / React Native**
- **TypeScript**
- **Expo Router**
- iOS first
- Android later

理由:
- Windows中心でもiOS向け開発・EAS Buildが可能
- Androidへ展開しやすい
- React/TypeScriptでCodexが扱いやすい
- OTAを必要な範囲だけ利用可能

注意:
- EAS Updateを「無料だから常用」しない。
- runtimeVersion / channelを厳密に管理する。
- native dependencyが変わる変更はStore buildを前提とする。

## 7.2 Backend / API

- **Cloudflare Workers**
- Router: **Hono** を推奨
- REST `/v1`
- cursor pagination
- write endpointはidempotencyを考慮

理由:
- scale-to-zero
- R2 / Queues / Durable Objectsとの統合
- 個人開発で運用負荷が低い

## 7.3 Authentication

- **Better Auth**
- Apple + Google
- Expo clientはSecure Storeを利用
- Auth backendはWorkers側

認証状態をClerk等のMAU課金サービスへ強く依存させない。

## 7.4 Primary Database

### 決定: **Turso + Drizzle ORM**

D1ではなくTursoをProduction v1のmain DBとする。

理由:
- Free tierがSNSの初期検証に大きい
- 低価格のDeveloper / Scalerへ滑らかに移行できる
- D1の「1 DB 10GB上限」「1 DBがsingle-threaded」という構造を、中央集権型SNSのmain DBに最初から背負わない
- DrizzleでSQL層を抽象化し、将来のPostgreSQL移行余地を残せる

注意:
- SQLite系DBであるため、write-heavyな処理を無計画に集中させない。
- いいねcount等を毎回巨大集計しない。
- denormalized counters / batch / async更新を必要に応じて使う。
- repository/service layerを設け、Turso SDK呼び出しをUIやrouteへ散らさない。

### D1の位置付け

D1は不採用という意味ではない。Cloudflare内の小規模補助DB、将来の分割データ、運営ツール等では使用候補。ただしv1のmain social graph DBにはしない。

## 7.5 ORM / Migration

- **Drizzle ORM**
- migrationはrepository内でversion control
- production migrationはCIから明示実行
- destructive migrationは自動適用しない

## 7.6 Image Storage

- **Cloudflare R2**
- avatar / post image / DM image
- clientからR2へのdirect uploadを基本
- Workersは短命upload permission / keyを発行
- DBにはobject keyとmetadataのみ保存

画像配信でアプリserverをproxyしない。

## 7.7 Video

### 決定: **Cloudflare Stream**

動画をR2に単純保存して終わりにしない。

理由:
- encoding込み
- HLS / DASH
- adaptive delivery
- direct creator uploads
- bandwidthを含む分単位課金で予算を予測しやすい

方針:
- 最大90秒 / 1080p
- direct creator upload
- autoplay muted
- viewport外で停止
- preloadは最大次の1件程度
- early alphaでは`video_upload_enabled=false`でもよい
- cost guardrailを管理画面へ表示

## 7.8 Realtime DM

- **Cloudflare Durable Objects + WebSocket Hibernation**
- conversation単位または適切なshard単位
- realtime delivery / typing / presence coordinationに利用
- 永続メッセージ履歴はTursoへ保存

すべてのSNSイベントをrealtimeにしない。realtimeはDMなど価値の高い箇所に限定。

## 7.9 Background Jobs

- **Cloudflare Queues**

対象:
- push dispatch
- notification fan-out
- analytics side effects
- moderation async tasks
- media post-processing webhook handling

ユーザー向けAPI responseを不要な外部処理で待たせない。

## 7.10 Push

- **Expo Notifications / Expo Push Service**
- token mappingをDBで管理
- invalid tokenを除去
- notification preferenceを尊重

将来必要ならAPNs / FCM直接送信へ移行可能なservice boundaryを作る。

## 7.11 Payments

- **RevenueCat**
- App Store IAP / StoreKitをRevenueCat経由で統一
- entitlement中心で判定
- restore purchases必須
- webhookをWorkersで受信し、DBへsubscription stateを同期

## 7.12 Analytics / Product Analytics

- **PostHog**
- onboarding / feed / post / follow / retentionを計測
- PIIをむやみに送らない

Feature Flag:
- UI experimentはPostHogを利用可能
- `registration_enabled`, `dm_enabled`, `video_upload_enabled`等の安全・運用上重要なflagは**server-side canonical flag**を持つ

## 7.13 Error Monitoring

- **Sentry** を第一候補
- Expo app crash
- Workers error
- source map
- release tagging

予算や無料枠が変わった場合は、同等のerror trackingへ差し替え可能な薄いintegrationにする。

## 7.14 Search

初期:
- Turso SQL + index
- exact username
- prefix search
- hashtag / event indexed lookup

専用検索サービスは導入しない。

導入条件:
- DB検索latency / relevanceが明確に問題化
- 日本語全文検索品質がproduct KPIを阻害

## 7.15 Admin

- internal web admin
- Cloudflareでhost
- moderator role / admin role
- strong auth
- public appから完全分離

## 7.16 CI/CD

- GitHub
- GitHub Actions
- EAS Build / Submit
- Wrangler deploy
- preview / staging / productionを分離

---

# 8. 全体アーキテクチャ

```text
Expo / React Native
        |
        | HTTPS
        v
Cloudflare Workers (API / Better Auth / Feed / Safety)
        |
        +---------------- Turso + Drizzle
        |                  users/posts/social graph/messages metadata
        |
        +---------------- R2
        |                  images
        |
        +---------------- Cloudflare Stream
        |                  video encode/delivery
        |
        +---------------- Durable Objects
        |                  realtime DM coordination
        |
        +---------------- Queues
                           async notifications/jobs

External:
- Expo Push Service
- RevenueCat
- PostHog
- Sentry
```

---

# 9. Repository Structure

推奨monorepo:

```text
/apps
  /mobile        Expo app
  /admin         moderation/admin web
  /api           Cloudflare Workers
/packages
  /db            Drizzle schema, migrations, repositories
  /auth          Better Auth shared config/types
  /contracts     API schemas/types
  /config        feature flags/shared constants
  /ui            shared primitives where practical
/docs
  01_product_requirements_and_architecture.md
  02_ui_screen_spec.md
  03_cold_start_rollout_operations.md
```

必ずしもこの構造を機械的に採用する必要はないが、責務分離を維持する。

---

# 10. Core Data Model

最低限のテーブル。実装時にnormalization / indexを詰める。

## 10.1 Identity

### users
- id
- auth_user_id
- birth_date
- age_band
- status
- created_at
- updated_at

### profiles
- user_id
- username unique
- display_name
- avatar_key
- bio
- prefecture optional
- affiliation optional
- school_stage optional
- is_private
- dm_policy
- created_at
- updated_at

### user_events
- user_id
- event_code
- priority

### personal_bests
- id
- user_id
- event_code
- performance_text
- self_reported
- created_at

## 10.2 Social Graph

### follows
- follower_id
- followee_id
- created_at

### follow_requests
- requester_id
- target_id
- status
- created_at
- resolved_at

### blocks
- blocker_id
- blocked_id
- created_at

### mutes
- muter_id
- muted_id
- created_at

## 10.3 Posts

### posts
- id
- author_id
- text
- visibility
- event_tag
- status
- created_at
- updated_at
- deleted_at

### post_media
- id
- post_id
- type image/video
- provider r2/stream
- object_key_or_uid
- width
- height
- duration_ms
- order_index
- status

### hashtags
- id
- normalized_name

### post_hashtags
- post_id
- hashtag_id

### likes
- user_id
- post_id
- created_at

### saves
- user_id
- post_id
- created_at

### comments
- id
- post_id
- author_id
- parent_comment_id nullable
- text
- status
- created_at
- updated_at

## 10.4 Messaging

### conversations
- id
- user_a_id
- user_b_id
- request_status
- created_at
- updated_at

### messages
- id
- conversation_id
- sender_id
- type
- text
- media_key nullable
- created_at
- deleted_at

### message_reads
- conversation_id
- user_id
- last_read_message_id
- updated_at

## 10.5 Notifications

### notifications
- id
- user_id
- actor_id nullable
- type
- entity_id nullable
- read_at
- created_at

### push_tokens
- id
- user_id
- platform
- token
- active
- updated_at

## 10.6 Safety

### reports
- id
- reporter_id
- target_type
- target_id
- reason
- details
- priority
- status
- created_at

### moderation_actions
- id
- target_user_id nullable
- target_type
- target_id nullable
- action_type
- reason
- moderator_id
- starts_at
- ends_at nullable
- created_at

### appeals
- id
- user_id
- moderation_action_id
- text
- status
- reviewed_by
- created_at
- resolved_at

### moderation_audit_log
- id
- actor_admin_id
- action
- target_type
- target_id
- metadata
- created_at

## 10.7 Monetization

### subscriptions
- user_id
- revenuecat_customer_id
- entitlement
- status
- expires_at
- updated_at

## 10.8 Recommendation / Operations

### recommendation_events
必要なサーバー側eventだけ保持。長期analyticsはPostHogへ。

### feature_flags
- key
- enabled
- config_json
- updated_by
- updated_at

### invite_codes / invite_redemptions
Cold Start文書参照。

---

# 11. 必須Index方針

実装時にquery planを確認する。

例:
- profiles(username)
- posts(author_id, created_at desc)
- posts(event_tag, created_at desc)
- follows(follower_id, created_at)
- follows(followee_id, created_at)
- comments(post_id, created_at)
- messages(conversation_id, created_at)
- notifications(user_id, created_at desc)
- reports(status, priority, created_at)
- recommendation_events(user_id, created_at)

N+1を避ける。Feedでpostごとに個別queryを実行しない。

---

# 12. API Design

Base: `/v1`

## Auth
- `GET /me`
- Better Auth routes under dedicated auth path

## Profile
- `GET /users/:username`
- `PATCH /me/profile`
- `GET /users/:id/followers`
- `GET /users/:id/following`

## Feed
- `GET /feed/recommended?cursor=`
- `GET /feed/following?cursor=`

## Posts
- `POST /posts`
- `GET /posts/:id`
- `PATCH /posts/:id`
- `DELETE /posts/:id`
- `POST /posts/:id/like`
- `DELETE /posts/:id/like`
- `POST /posts/:id/save`
- `DELETE /posts/:id/save`
- `POST /posts/:id/comments`

## Social
- `POST /users/:id/follow`
- `DELETE /users/:id/follow`
- `POST /follow-requests/:id/accept`
- `POST /follow-requests/:id/decline`
- `POST /users/:id/block`
- `POST /users/:id/mute`

## Media
- `POST /media/image-upload-session`
- `POST /media/video-upload-session`
- `POST /media/complete`

## DM
- `GET /conversations`
- `POST /conversations/request`
- `POST /conversations/:id/accept`
- `GET /conversations/:id/messages?cursor=`
- `POST /conversations/:id/messages`
- WebSocket endpoint for realtime

## Notification
- `GET /notifications?cursor=`
- `POST /notifications/read`
- `POST /push-tokens`

## Safety
- `POST /reports`
- `POST /appeals`

## Billing
- `POST /webhooks/revenuecat`
- `GET /me/entitlements`

---

# 13. Media Pipeline

## Image

1. Client asks Workers for upload session.
2. Worker validates auth, mime, intended use, size limits.
3. Client uploads directly to R2.
4. Client calls complete endpoint.
5. Worker verifies object metadata and creates DB record.
6. Feed uses CDN/publicly controlled delivery URL.

## Video

1. Client asks Workers for Stream Direct Creator Upload.
2. Worker validates video feature flag and user permission.
3. Client uploads directly to Stream.
4. Stream webhook -> Worker -> Queue.
5. DB media status changes `processing -> ready/failed`.
6. Feed only serves ready media.

Do not proxy video bytes through Workers.

---

# 14. Performance / Cost Guardrails

- Cursor pagination only. offset paginationをfeedに使わない。
- Feed responseは原則20件前後から開始。
- prefetchしすぎない。
- videosはviewport内のみ再生。
- next video preloadは限定。
- countersを毎回full countしない。
- write pathで不要なanalytics処理を同期実行しない。
- DB query count / rows read / rows writtenを観測する。
- R2 / Stream / Workers / Tursoにbudget alertsを設定。
- 管理画面に月次推定コストを表示。

---

# 15. Security

- ClientからDBへ直接writeさせない。
- authorizationはWorkersで毎回確認。
- object upload keyをclient任せにしない。
- upload URLは短命。
- API rate limit。
- report / DM / follow / comment / signupにabuse protection。
- secretsをrepoへcommitしない。
- session / tokenはSecure Store。
- adminは一般ユーザー権限と分離。
- moderation actionはaudit log必須。
- account deletionは5.6の方針に従い、保持期間と削除完了条件を実装前に確定する。

---

# 16. Observability

Sentry:
- app crash
- API exception
- release/version

Cloudflare/Turso dashboards:
- error rate
- latency
- request count
- DB usage

PostHog:
- product events
- funnel
- retention

ログにDM本文、アクセストークン等の秘密情報を出さない。

---

# 17. Testing

最低限:

### Unit
- recommendation scoring
- permission rules
- teen DM rules
- visibility rules
- moderation enforcement

### Integration
- auth
- follow/private follow request
- post creation
- R2 complete flow
- Stream webhook
- RevenueCat webhook
- report -> moderation action

### E2E
- onboarding -> feed
- create post -> another account sees post
- private follow -> approve
- DM request -> accept -> message
- report -> admin review
- purchase -> entitlement

---

# 18. Feature Flags

server canonical flags:
- `registration_enabled`
- `invite_only_enabled`
- `max_active_users`
- `video_upload_enabled`
- `video_autoplay_enabled`
- `dm_enabled`
- `dm_media_enabled`
- `ads_enabled`
- `support_plan_enabled`
- `sprinq_cta_enabled`
- `event_pages_enabled`
- `team_pages_enabled`
- `ranking_enabled`
- `recommendation_v2_enabled`

clientだけで制御しない。serverが必ずenforceする。

---

# 19. Implementation Order

1. Monorepo / environments / CI
2. Workers API skeleton + contracts
3. Turso + Drizzle schema / migrations
4. Better Auth + Apple/Google
5. onboarding / profile
6. follow/private account/block/mute
7. safety / admin basic（report queue、非表示、機能制限、audit log）
8. R2 image upload
9. posts/comments/likes/saves
10. Home recommended/following
11. search/discovery
12. notifications + Queues + push
13. DM persistence + Durable Objects
14. Cloudflare Stream video
15. PostHog + Sentry
16. RevenueCat
17. recommendation tuning
18. ads/sprinq gated integration
19. full QA/security/performance review

---

# 20. Done Definition

Production v1完成とは「画面が存在する」だけではない。

- permission / visibilityがserver enforced
- loading / empty / error stateがある
- analyticsが取れる
- abuse pathが塞がれている
- migrationが再現可能
- cost guardrailがある
- critical pathの自動testがある
- feature flagで段階公開できる
- adminからmoderation可能
- docsと実装が一致

---

# 21. 外部仕様メモ（2026-09-26確認）

実装前に再確認すること。

- Cloudflare D1: Free 5M rows read/day, 100k writes/day; paid includes 25B reads/month, 50M writes/month. 1 DB max 10GB on paid and each DB is single-threaded.
- Turso: Free 500M reads/month, 10M writes/month, 5GB; Developer/Scalerへ段階的に拡張可能。
- Cloudflare Stream: encoding/ingress included; stored minutes and delivered minutesで課金。
- Better Auth: Expo integrationあり。Secure Store利用を公式に案内。
- RevenueCat: 月間tracked revenue $2,500まで無料、その後基本1%。
- Cloudflare Queues / Durable ObjectsはFree planでも利用可能。
- PostHog Product Analyticsは月100万eventsまで無料枠あり。

料金は変更され得るので、コードやプロダクト要件に金額をhard-codeしない。
