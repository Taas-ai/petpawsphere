# Launch-Readiness + Subscription Paywall — Spec 1

**Date:** 2026-04-23
**Author:** Release engineering session
**Status:** Approved (awaiting written-spec review)
**Supersedes scope of:** `docs/plans/2026-03-09-launch-readiness-report.md` (stale; 85% of its P0s already shipped)

## 1. Why this spec exists

The 2026-03-09 readiness report listed 8 P0 blockers and 8 warnings. As of 2026-04-23, audit shows most P0s shipped in commits `9389179`, `60d5a7e`, `dcf0686`. This spec closes the remaining genuine gaps **and** extends the dark-launched monetization scaffold from "one-time boost" into "subscription paywall after match #3" per the revised brief.

Pricing (see `MONETIZATION.md`, `pet-mating-app-prd.md`, `docs/plans/2026-03-09-launch-readiness-report.md`, all updated 2026-04-23):
- **PetPawSphere Plus:** 39 AED/month or 390 AED/year
- Free tier: 3 `/matches/analyze` POSTs per calendar month (UTC)

## 2. Non-goals

Out of scope; belongs to later specs:

- Actual Firebase deploy / Stripe live-mode switch → **Spec 2**
- Capacitor `cap add ios/android`, fastlane Fastfile, TestFlight, Play Internal → **Spec 3**
- Breeder Pro (149 AED/mo) and Clinic Partner (499 AED/mo) tiers — different products
- Stripe Billing Portal custom UI (the hosted portal URL is enough for launch)
- Annual-plan promo codes, `PAWSLAUNCH50` coupon
- Subscription cancellation/refund flows beyond Stripe's default
- Avatar upload in Profile (separate feature)

## 3. Scope split — two PRs

The work splits along a credential boundary. PR-1 needs no Stripe keys and can merge today. PR-2 is dark-launched and gated on the monetization flag — also safe to merge without Stripe keys, but won't light up until keys are set in Spec 2.

### PR-1 — Readiness gap closure

- Sentry integration (server + web), DSN-gated
- `PATCH /api/auth/me` profile update endpoint
- `Profile.tsx` wired to the new endpoint, remove "Coming soon" placeholder
- `loading="lazy"` on `<img>` tags rendering user-generated pet photos
- Tests for the above

### PR-2 — Subscription paywall

- Subscription-mode checkout (Callable extension)
- Webhook expansion for `customer.subscription.*` and `invoice.payment_failed`
- Quota enforcement middleware on `POST /matches/analyze`
- `PaywallSubscription` React component (distinct from the existing boost `Paywall`)
- `MatchQuotaBadge` on Dashboard
- RevenueCat Capacitor plugin install + no-op web stub
- i18n keys for all new UI strings (English + Arabic)
- PostHog events: `paywall_shown_subscription`, `quota_exhausted`, `subscription_started`
- Tests for the above

## 4. Architecture

Three systems touch. The split is deliberate:

```
┌─────────────────────────────────────────────────────────────┐
│ Web (packages/web)                                          │
│  ├─ PaywallSubscription  ──┐                                │
│  ├─ MatchQuotaBadge        │ calls                          │
│  ├─ Profile (PATCH /me)    │                                │
│  └─ Sentry init            │                                │
└───────────────────────────┬┴───────────────────────────────┘
                            │ HTTPS /api/*
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Express API (packages/server) — via Firebase Functions `api`│
│  ├─ middleware/quota.ts    (counts matches, checks sub)     │
│  ├─ routes/matches.ts       applies quotaMiddleware on POST │
│  ├─ routes/auth.ts          adds PATCH /me                  │
│  └─ lib/sentry.ts           @sentry/node                    │
└───────────────────────────┬┴───────────────────────────────┘
                            │ Drizzle → Supabase
                            ▼
                      [subscriptions table — already exists]

┌─────────────────────────────────────────────────────────────┐
│ Firebase Callable Functions (functions/src/billing/)        │
│  ├─ createCheckoutSession   extended: mode='subscription'   │
│  └─ stripeWebhook           extended: customer.subscription │
└─────────────────────────────────────────────────────────────┘
```

**Why Callables, not Express, for billing:** Existing pattern (commit history). Callables give region pinning (`me-central1`), automatic `req.auth.uid`, independent cold-start. Quota enforcement stays in Express because that's where the gated route (`/matches/analyze`) lives.

## 5. Subscription gate mechanics

### Quota rule

A user hits the paywall on their **4th** `POST /matches/analyze` within the current calendar month (UTC) unless they have an active subscription.

- What counts: successful inserts into `matches` by `requestedBy = userId`, `createdAt >= start_of_month_utc`
- Includes matches later rejected/accepted — AI compute is already spent
- Does NOT count `GET` reads or `PUT /respond`
- Reset: 00:00 UTC on day 1 of calendar month. No rollover, no grace.

### Active-subscription predicate

User is Plus if exists a `subscriptions` row where `userId = ?` AND `status IN ('active', 'trialing')` AND `currentPeriodEnd > now()`.

Checked per-request in Express middleware. No global cache; the extra Drizzle query is cheaper than stale-state bugs.

### Quota middleware contract

`middleware/quota.ts` export:

```ts
export function requireMatchQuota(db: PetPawSphereDb):
  (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>
```

Behavior (pseudocode):

```
if MONETIZATION_ENABLED != 'true':     return next()    // dark-launched
if user has active subscription:        return next()
count = db.matches.count(requestedBy=userId, createdAt >= start_of_month_utc)
if count >= 3:
  return res.status(402).json({
    error: 'quota_exceeded',
    matchesUsed: count,
    quota: 3,
    upgradeUrl: '/billing'
  })
req.quotaState = { matchesUsed: count, quota: 3 }
return next()
```

Applied in `matches.ts`: `router.post('/analyze', requireMatchQuota(db), async ...)`.

### Client handling of 402

`MatchCreate.tsx`:

```tsx
const res = await api.matches.analyze(...);
if (res.status === 402) {
  setPaywall(await res.json());    // { matchesUsed, quota, upgradeUrl }
  return;
}
```

When `paywall` state is set, render `<PaywallSubscription matchesUsed={...} quota={...} />` inline in the form, not as a modal. Modal is an anti-pattern here — user already clicked a CTA, an interstitial breaks flow.

### Dashboard quota badge

`MatchQuotaBadge` queries `GET /api/matches/quota` (new; returns `{ matchesUsed, quota, isSubscribed }`) and renders:

- Free tier, matchesUsed < 3: "2/3 matches used this month" (amber)
- Free tier, matchesUsed >= 3: "3/3 matches used — upgrade for unlimited" (red, links to `/billing`)
- Subscribed: hidden

## 6. Delta list

### Database (`packages/db`)

**No schema change.** `subscriptions` and `boosts` tables already exist (schema.ts:134-152).

### Server (`packages/server`)

| File | Change |
|---|---|
| `src/middleware/quota.ts` | NEW — `requireMatchQuota(db)` |
| `src/routes/matches.ts` | Apply `requireMatchQuota(db)` on `POST /analyze` only |
| `src/routes/matches.ts` | NEW route `GET /quota` → `{ matchesUsed, quota, isSubscribed }` |
| `src/routes/auth.ts` | NEW route `PATCH /me` — update `name`, `phone`, `emirate`. Explicitly reject `email`, `kycVerified`, `role`, `id` in body (400 if present). |
| `src/lib/sentry.ts` | NEW — `initSentry()` gated on `process.env.SENTRY_DSN` |
| `src/api-server.ts` | Call `initSentry()` before `app.use(helmet())`. Call `Sentry.setupExpressErrorHandler(app)` after all routers. |

### Web (`packages/web`)

| File | Change |
|---|---|
| `src/components/PaywallSubscription.tsx` | NEW — "You've used 3/3 matches. Upgrade to Plus for unlimited, 39 AED/mo." Calls `createSubscriptionCheckoutSession(VITE_STRIPE_PRICE_PLUS_MONTHLY)`. |
| `src/components/MatchQuotaBadge.tsx` | NEW — renders quota progress on Dashboard |
| `src/pages/Dashboard.tsx` | Mount `<MatchQuotaBadge />` above CTAs |
| `src/pages/Profile.tsx` | Wire form to `PATCH /me`, remove "Coming soon" placeholder |
| `src/pages/MatchCreate.tsx` | On 402, render `<PaywallSubscription matchesUsed={..} quota={..} />` inline |
| `src/lib/billing.ts` | Add `createSubscriptionCheckoutSession(priceId: string): Promise<{ url }>` |
| `src/lib/sentry.ts` | NEW — `initSentry()` gated on `import.meta.env.VITE_SENTRY_DSN` |
| `src/main.tsx` | Call `initSentry()` before `createRoot` |
| `src/lib/revenuecat.ts` | NEW — `initRevenueCat()` no-ops when `Capacitor.getPlatform() === 'web'`, else stub-configures |
| `src/i18n/index.ts` (or locale files) | Add keys: `paywall.heading`, `paywall.subtext`, `paywall.cta`, `quota.used`, `quota.exhausted`, `profile.saved`, `profile.error` — English + Arabic |
| `<img>` audit | Add `loading="lazy"` on any `<img>` rendering user-supplied `photoUrls[]`. Targets: `PetDetail.tsx`, `MatchDetail.tsx`, `BreedDetect.tsx`, `MatchesList.tsx`. |

### Firebase Functions (`functions/src/billing/`)

| File | Change |
|---|---|
| `createCheckoutSession.ts` | Extend payload to `{ priceId, petId?, mode: 'payment' \| 'subscription' }`. When `mode === 'subscription'`: skip petId, set `metadata.kind='plus_subscription'`, use `${WEB_ORIGIN}/billing/success` and `${WEB_ORIGIN}/billing/cancel` URLs, pass `subscription_data: { metadata: { userId: req.auth.uid } }`. |
| `stripeWebhook.ts` | Add case branches: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Each upserts the `subscriptions` table keyed by `userId` (read from `subscription.metadata.userId`). Signature verification stays unchanged. |
| `package.json` (functions) | No new deps — `stripe` already present |

### Package.json additions

| Package | Dep | Justification |
|---|---|---|
| `packages/server` | `@sentry/node` | Required for server-side Sentry. Industry standard. |
| `packages/web` | `@sentry/react` | Required for web Sentry with React error boundaries. |
| `packages/web` | `@revenuecat/purchases-capacitor` | Standard Capacitor IAP library. Declared in `MONETIZATION.md` as the chosen mobile path. Stubbed on web platform (no bundle impact on web build). |

No other new deps. (`stripe` already present in `functions/`.)

### Env (`.env.example`)

Add:

```
# Sentry
SENTRY_DSN=
VITE_SENTRY_DSN=

# Stripe — subscription price IDs (test mode)
STRIPE_PRICE_PLUS_MONTHLY=price_your_plus_monthly_id
STRIPE_PRICE_PLUS_ANNUAL=price_your_plus_annual_id
VITE_STRIPE_PRICE_PLUS_MONTHLY=price_your_plus_monthly_id

# RevenueCat (mobile — stubs for iOS/Android builds)
REVENUECAT_PUBLIC_KEY_IOS=
REVENUECAT_PUBLIC_KEY_ANDROID=
```

## 7. i18n (English + Arabic)

New keys, placed in existing i18n files:

| Key | English | Arabic |
|---|---|---|
| `paywall.heading` | "Upgrade to PetPawSphere Plus" | "الترقية إلى PetPawSphere Plus" |
| `paywall.subtext` | "You've used {{used}}/{{quota}} matches this month. Get unlimited with Plus." | "لقد استخدمت {{used}}/{{quota}} مطابقات هذا الشهر. احصل على مطابقات غير محدودة مع Plus." |
| `paywall.cta` | "Upgrade for 39 AED/mo" | "الترقية مقابل 39 درهم/شهر" |
| `quota.used` | "{{used}}/{{quota}} matches used this month" | "تم استخدام {{used}}/{{quota}} مطابقات هذا الشهر" |
| `quota.exhausted` | "{{quota}}/{{quota}} matches used — upgrade for unlimited" | "تم استخدام {{quota}}/{{quota}} مطابقات — الترقية للحصول على عدد غير محدود" |
| `profile.saved` | "Profile updated" | "تم تحديث الملف الشخصي" |
| `profile.error` | "Update failed" | "فشل التحديث" |

Arabic translations to be reviewed by a native speaker before production flag-flip; fine to land for dark launch.

## 8. PostHog events

Add to the existing analytics instrumentation (pattern per CLAUDE.md):

| Event | Where fired | Properties |
|---|---|---|
| `paywall_shown_subscription` | `PaywallSubscription` mounts | `{ matchesUsed, quota, surface: 'match_create' \| 'dashboard' }` |
| `quota_exhausted` | Server returns 402 (fire from client on receipt) | `{ matchesUsed, quota }` |
| `subscription_started` | Client reaches `/billing/success?session_id=...` | `{ plan: 'plus_monthly' \| 'plus_annual' }` |
| `profile_updated` | `Profile.tsx` successful PATCH | `{ fieldsChanged: string[] }` |

## 9. Testing

Tests live alongside existing patterns in `packages/server/tests/` and (new) `packages/web/tests/`.

| Test | Asserts |
|---|---|
| `server/tests/api/matches-quota.test.ts` | 3 matches pass; 4th returns 402 with `quota_exceeded`; subscribed user (seeded `subscriptions` row) bypasses; dark-launched flag off → no 402 |
| `server/tests/api/matches-quota.test.ts` | `GET /quota` returns correct `{ matchesUsed, quota, isSubscribed }` for all three states |
| `server/tests/api/auth-profile-update.test.ts` | PATCH with `{ name, phone, emirate }` succeeds; rejects any attempt to set `email`/`role`/`kycVerified`/`id` (400); 401 unauth |
| `functions/tests/webhook-subscription.test.ts` | Valid `customer.subscription.created` upserts row; `customer.subscription.deleted` sets `status='canceled'`; `invoice.payment_failed` sets `status='past_due'`; invalid signature → 400 |
| `web/tests/PaywallSubscription.test.tsx` | Renders nothing when `VITE_MONETIZATION_ENABLED=false`; renders on 402 input; clicking CTA calls `createSubscriptionCheckoutSession` |
| `web/tests/MatchQuotaBadge.test.tsx` | Hidden for subscribed; amber for 0-2; red for 3 |

Existing test count: 13 test files. Target after PR-1 + PR-2: +6 files.

## 10. Error handling

- **Quota middleware** throws on DB error → Sentry captures, client gets 500. Do not fail-open (would silently break metering).
- **Subscription webhook** must be idempotent — use Stripe `event.id` as upsert key in a future `billing_events` table; **for this spec**, rely on PostgreSQL `ON CONFLICT` on `subscriptions.userId`. Acceptable because Stripe retries identical events; last-write-wins on the same subscription state is safe.
- **Profile PATCH** — atomic. If any forbidden field present, reject whole request (400). Don't partially update.
- **Sentry init** — if DSN unset, `initSentry()` is a no-op. Never throw at boot.
- **RevenueCat init** — must no-op on web platform. Never attempt native bridge on web.
- **Quota race condition** — known-acceptable. Two concurrent 3rd-match requests both see `count=2`, both pass middleware, both insert → user gets 4 free matches. Business impact: one extra AI call per racing user, rare. Mitigation (deferred): DB unique constraint on `(requestedBy, month_bucket)` in a future spec if observed in metrics.

## 11. Rollout

No flag flip in this spec. `MONETIZATION_ENABLED=false` and `VITE_MONETIZATION_ENABLED=false` stay. Server quota middleware no-ops when flag is off → existing free-unlimited behavior preserved. Sentry can turn on independently (its DSN-gated).

The flag flips in **Spec 2**, after:
1. Stripe test products are created, `price_*` IDs are in Functions secrets
2. One round of Stripe-test-card validation end-to-end
3. Webhook endpoint registered in Stripe dashboard

## 12. Blockers documented for user (BLOCKERS.md)

Written at the end of PR-2 implementation; not blocking PR-1:

- Create 2 Stripe test products → `plus_monthly` (39 AED recurring), `plus_annual` (390 AED recurring)
- `firebase functions:secrets:set STRIPE_PRICE_PLUS_MONTHLY`, `STRIPE_PRICE_PLUS_ANNUAL`
- Create Sentry project → paste DSN into `SENTRY_DSN` and `VITE_SENTRY_DSN`
- Register webhook endpoint `https://<host>/api/stripe-webhook` in Stripe dashboard for `customer.subscription.*` and `invoice.payment_failed`
- Native Arabic speaker review of new i18n keys before flag-flip

## 13. Out of scope — pointers to future specs

| Deferred to | Scope |
|---|---|
| Spec 2 (2026-04-24 or later) | `firebase login` → `firebase deploy`, verify register → pet create → breed detect on live URL, flip `MONETIZATION_ENABLED=true`, paste real Stripe keys |
| Spec 3 (2026-04-25 or later) | `npx cap add ios && npx cap add android`, fastlane Fastfile for both platforms, keystore generation doc, TestFlight upload dry-run, Play Internal upload dry-run. Stops before public submit. |
