# 03 Cold Start, Rollout & Operations

**Project:** 陸上SNS（仮称）  
**Status:** Canonical rollout/operations specification  
**Version:** 2.0  
**Depends on:** `01_product_requirements_and_architecture.md`, `02_ui_screen_spec.md`

---

# 1. 目的

SNSは機能完成だけでは成立しない。初期ユーザーが少ない状態でも価値があり、安全運用能力とコストを超えずに成長させるため、公開を段階化する。

中心仮説:

> 陸上競技者だけが集まり、同じ種目や興味の人を見つけやすく、フォロワー数に関係なく競技投稿が見てほしい選手へ届くなら、既存SNSとは別に継続利用される。

---

# 2. 成長原則

- 一般公開を最初からしない。
- 広く薄く集めるより密度を作る。
- 登録者数だけを成功指標にしない。
- フォロワー0でも投稿が試験配信される。
- feedが空の状態を許容しない。
- 無料ユーザーの投稿/閲覧/交流を制限しない。
- Safety Capacityを超えてユーザーを増やさない。
- 実装済み機能でもFeature Flagで段階公開する。
- 動画などコストの大きい機能は、価値検証と予算監視ができる段階で開放する。
- 開発者の知人、学校、クラブへの依頼を初期獲得の前提にしない。開発者の個人開発活動を周囲へ開示することも必須にしない。
- 協力者や紹介者の参加は本人の同意が得られた場合の選択肢とし、実際の参加が決まるまで供給・集客計画へ算入しない。

---

# 3. Stages

## Stage 0 Development

対象:
- developer / isolated test accounts。外部協力者を必要としない

必須:
- auth
- core DB
- posts
- feed
- follow
- block/report
- admin basic
- 自動testと複数の検証用アカウントでprivate / teen / block / reportを確認

外部公開なし。

## Stage 1 Solo Alpha

対象:
- 開発者のみ。複数の検証用アカウントはdev / staging限定

目的:
- posting friction
- feed usability
- critical bugs
- moderation flow
- 新規登録から削除までの一人で実行できるE2E確認

Default flags例:
- registration OFF（開発者だけ利用可能）
- video OFF
- DM OFF or limited
- ads OFF
- support plan OFF

Gate:
- no critical data loss
- report/block works
- post success stable
- admin can restrict user
- 削除申請と復旧、media削除ジョブを確認
- 重大通報に気付けない時間帯を含めた運営手順を用意

## Stage 2 Limited Public Beta

- 招待先がいなくても開始できる少数枠の公開募集。登録上限と受付停止flagで流入を制御する
- 東京高校陸上に関心のある利用者を最初の対象候補とする。特定の学校や知人の参加を前提にしない
- 公開募集の前に、運営者自身の実在する投稿と利用方法の説明を用意する。架空ユーザーや架空交流を作らない

目的:
- social interaction成立
- recommended feed初期品質
- comments/follows
- safety workload

Gate:
- 直近7日間の実投稿と作者数を計測し、初回feedの空表示率を把握できる
- 重大通報は原則24時間以内に初回確認でき、未確認が残る間は募集枠を広げない
- D1/D7、初週の投稿・フォロー・コメントの実施率を計測できる
- 投稿者が少ない場合は拡大せず、利用者へ現状を正直に示して募集や投稿導線を改善する

## Stage 3 Controlled Expansion: 150〜500

目的:
- recommendation tuning
- teen settings
- limited DM
- push
- video cost test

Gate:
- activity continues
- moderation manageable
- app/api stability
- cost per active user known
- 直近4週間、投稿供給・安全対応・月次費用見込みが継続している

## Stage 4 Open Beta: 500〜2,000+

目的:
- cold-start卒業判定
- new creator exposure
- support plan limited launch
- ads limited test
- sprinq contextual test

Gate:
- follow 0でもgood feed
- new creator initial exposure
- safety queue sustainable
- infrastructure cost sustainable

## Stage 5 Public App Store

Gate:
- legal/privacy review
- App Store UGC requirements
- teen protections
- appeal process
- cost monitoring
- crash/api quality
- 直近4週間の投稿供給・安全対応・費用見込みが持続し、公開後の登録上限と停止手順がある

---

# 4. 最初の1,000人

## 0〜30

- まず開発者が一人で機能と運営を検証する。検証用seedはdev / stagingに限定
- 外部公開時は少数枠で募集し、登録数より投稿者数・交流・安全対応を確認する
- 本番に用意する投稿は運営者自身の実在する内容とし、出典と運営者投稿であることを明示する

## 30〜100

- 少数枠の公開募集を継続し、関心が近い人が同時期に参加できるよう告知する
- niinaeさんへの試用・紹介相談は、利用可能な試用版と安全運営の準備後に行う選択肢。協力を前提に数値計画を立てない
- 招待コードは利用可能にしても、配布先が必要な運用を必須にしない

紹介を依頼する場合は、試用URL、対象ユーザー、何ができるか、既知の制限、連絡先を短く提示する。相手の協力や発信内容を先に決めたものとして扱わない。

Early Member badgeは可能。ただしranking advantageを与えない。

## 100〜300

- 東京高校陸上に関する公開発信と、本人が希望した利用者による共有
- 種目や大会の文脈に沿った発見導線を改善する
- 学校・クラブ単位の参加は自発的に生じた場合に支える

## 300〜1,000

- athletics creators
- clubs / schools
- user referrals
- competition-season posting prompts

重要:
全国へ均等に1,000人より、交流が発生するまとまりを優先。

---

# 5. Initial Content Supply

新規登録直後にHome候補を最低20件程度用意できる状態を目標とする。

少数公開の開始時点で20件を満たせない場合、件数を偽装しない。関心種目に合う実投稿を優先し、不足は明示した空状態と投稿導線で扱う。20件と複数作者を満たす前に大規模告知しない。

条件:
- multiple authors
- multiple events
- selected event relevance
- no repetitive same author
- text/photo/video mix as enabled

一般ユーザーに偽の活動を見せる目的でfake accountsを運用しない。開発用seedはdev/staging限定。

---

# 6. New User Cold Start

利用可能な初期signal:
- onboarding selected events
- initial follows
- optional prefecture
- first impressions/clicks

開始mixの例（remote config）:
- 50% event relevance
- 20% broader athletics quality
- 15% new/low-exposure creators
- 10% exploration across events
- 5% official/operational content if needed

固定hard-codeにしない。

---

# 7. New Creator Exploration

新規投稿を安全フィルタ後、小さな適合ユーザー群へtrial deliveryする。

Eligibility:
- event interest matches
- not blocked/muted
- exposure frequency okay
- content allowed

Expansion signals:
- complete watch
- rewatch
- save
- comment
- profile view
- follow

Downrank:
- immediate skip
- not interested
- mute
- block
- report

フォロワー数 / PB /大会順位は主要因にしない。

---

# 8. Invite System

## invite_codes
- id
- code
- inviter_user_id
- max_uses
- use_count
- expires_at
- status
- created_at

## invite_redemptions
- id
- invite_code_id
- invited_user_id
- redeemed_at

Admin:
- invite-only ON/OFF
- invites per user
- disable code
- max registrations

---

# 9. Feature Flags

Server-enforced:
- `registration_enabled`
- `invite_only_enabled`
- `max_active_users`
- `video_upload_enabled`
- `video_autoplay_enabled`
- `dm_enabled`
- `dm_media_enabled`
- `push_notifications_enabled`
- `ads_enabled`
- `support_plan_enabled`
- `sprinq_cta_enabled`
- `recommendation_v2_enabled`
- `event_pages_enabled`
- `team_pages_enabled`
- `ranking_enabled`

Requirements:
- admin editable
- environment specific
- audit history
- rollback
- segment rollout when useful

PostHog flags may be used for experiments, but safety-critical enforcement remains server-side.

---

# 10. Metrics Dashboard

## 暫定Go / Hold基準

以下は検証開始時の運用基準であり、業界平均を主張する数値ではない。小規模の実測をもとに改定し、変更履歴を残す。

- Solo Alpha終了: 登録、投稿、閲覧、フォロー、block、report、削除の主要経路を開発者が複数アカウントで再現できる。重大なデータ消失がなく、管理画面から投稿非表示と機能制限が可能。
- 少数公開の拡大: 重大通報を原則24時間以内に初回確認できる。24時間を超える未確認の重大通報があれば新規募集を止める。
- 投稿密度: 直近7日間の実投稿・投稿者数、初回feedの空表示率、同一作者への偏りを週ごとに記録する。複数作者の投稿がない状態で大規模告知しない。
- 継続利用: 登録後7日の再訪率と、初週に投稿・フォロー・コメントのいずれかをした割合を獲得経路別に測る。少数サンプルで固定の成功率を断定しない。
- 費用: DB読み取り/書き込み、画像処理、動画配信、OTA配信対象、月次推定費用を見てから募集枠を上げる。予算上限に近づいたら高費用機能と募集を止められる。

## Growth
- total users
- daily signups
- invite redemptions
- DAU / WAU / MAU
- DAU/MAU

## Engagement
- daily posts
- creator rate
- posts/user
- comment rate
- save rate
- follow creation rate
- follows/user

## Retention
- D1
- D3
- D7
- D14
- D30

## Feed
- empty feed rate
- posts shown in first session
- post open rate
- complete-watch rate
- quick skip rate
- not-interested rate
- same-author concentration
- new-creator exposure share

## Safety
- reports
- high-priority reports
- unresolved reports
- time to first review
- blocks
- DM report rate

## Cost
- Turso rows read/written/storage
- Workers requests / CPU
- R2 storage/operations
- Stream stored minutes/delivered minutes
- Queue operations
- DO requests/duration/storage
- EAS build/update usage
- estimated cost per DAU / MAU

---

# 11. Cost Guardrails

学生個人開発であるため、予期しない請求を防ぐ。

参考事例: Shincodeさんの「ぬい日和」運営談では、急な流入時の余分なDB読み取り、Expo OTA配信、画像変換・端末キャッシュが費用や体験の問題として挙げられている。これは他サービスの自己申告事例であり、本サービスの費用予測には流用しない。現在のExpo / Workers / Turso / R2 / Stream方針は暫定維持し、実測で見直す。

必須:
- provider billing alerts
- internal budget warning
- expensive features have flags
- query usage monitoring
- video delivered-minutes monitoring
- feed表示あたりのDB query / rows read、画像変換回数と端末キャッシュ量、OTAの配信対象数を確認

Operational thresholds are config, not permanent numbers.

Examples of response:
- Stream delivery surge -> disable autoplay/preload first, not immediately delete videos
- DB read surge -> inspect N+1/query plan/cache
- abuse surge -> restrict registration/DM
- Push surge -> batch/queue

Do not silently degrade safety to save cost.

---

# 12. Video Rollout

Architecture is Cloudflare Stream from the start, but availability can be staged.

Stage:
1. upload OFF in alpha
2. selected testers
3. short video enabled
4. broader rollout after cost/retention check

Metrics:
- upload success
- processing failure
- average duration
- playback start failure
- buffering
- average delivered minutes / active user
- Stream monthly estimate

Rules:
- max 90 sec initially
- 1080p max
- autoplay muted
- only visible video plays
- minimal preload

---

# 13. DM Rollout

Implementation completed in v1 but rollout staged.

1. OFF / internal only
2. approved cohort text-only
3. message requests + teen rules verified
4. media after approval
5. wider release

Monitor:
- request acceptance rate
- block rate
- DM reports
- teen/adult contact safety metrics

---

# 14. Monetization Rollout

## Support Plan

Implementation may exist before release; flag OFF initially.

Turn on when:
- free core experience proven
- purchase/restore tested
- RevenueCat webhook stable
- subscription disclosure correct

No ranking benefit.

投稿・閲覧・交流の基本機能は無料のまま維持する。価格・特典・支払い意思は実利用と費用の観測後に決める。

## Ads

Turn on only after feed value exists.

- native in-feed
- clearly labeled
- conservative frequency
- no forced interstitial
- no pre-roll initially

少数ユーザー段階の収支計画に広告収入を算入しない。頻度上限と利用体験への影響を測れる状態で小さく試す。

## sprinq

Enable after SNS standalone value is proven.

Only contextual CTA.

---

# 15. Go / Hold / Rollback

## Go
- content supply stable
- new user feed non-empty
- safety manageable
- retention not deteriorating
- infra cost sustainable

## Hold
- content shortage
- unresolved reports rising
- DB/video cost spike
- recommendation concentration
- high onboarding churn

## Rollback
- severe safety issue
- data corruption
- auth failure
- moderation controls broken
- runaway cost

Feature flags must permit immediate containment.

---

# 16. Analytics Events

## Registration
- `signup_started`
- `signup_completed`
- `interest_selected`
- `suggested_user_followed`
- `onboarding_skipped`

## Feed
- `feed_opened`
- `post_impression`
- `post_opened`
- `video_started`
- `video_completed`
- `video_replayed`
- `post_skipped`

## Social
- `like_created`
- `comment_created`
- `save_created`
- `follow_created`
- `follow_request_created`
- `profile_viewed`

## Posting
- `post_composer_opened`
- `post_created`
- `post_upload_failed`
- `draft_saved`

## Safety
- `report_created`
- `block_created`
- `mute_created`

Do not put private DM body or unnecessary PII into event properties.

---

# 17. Operations Routine

Daily during closed beta:
- critical crashes
- auth errors
- report queue
- abnormal cost
- upload failures

Weekly:
- D1/D7
- creator rate
- content density
- recommendation concentration
- top DB queries
- Stream usage
- moderation capacity

Before every stage increase:
- backup/restore test
- feature flag rollback test
- moderation path test
- purchase test if enabled
- cost estimate

---

# 18. Codex Implementation Requirements

Cold start is not just marketing. Codebase must include:

1. invite system
2. registration gate
3. feature flags
4. recommended users onboarding
5. initial-interest recommendation
6. new creator exploration
7. metrics instrumentation
8. safety queue/admin
9. cost dashboard hooks
10. staged video/DM/monetization rollout

---

# 19. Final Principles

- 1,000人を薄く集めない。
- フォロワー0を放置しない。
- 人気者だけのSNSにしない。
- 空feedを許さない。
- 安全運用能力以上に成長させない。
- 実装済み = 公開済みではない。
- ユーザー増加前にunit economicsを観測可能にする。
- いつでも前のstageへ戻れるようにする。
