# PetPawSphere — MONETIZATION

> No payments code exists today (verified across `package-lock.json`, source tree). This doc is the wiring plan.

## Recommended revenue model

| Tier | Surface | Price point (AED) | Margin profile |
|---|---|---|---|
| **Freemium subscription — PawMatch Plus** | Web + mobile | 39/mo or 390/yr | High margin; recurring |
| **Boosted profile / Super-match** | Mobile + web micro-IAP | 9 per boost, 49 for 10-pack | Very high margin |
| **Verified breeder/shelter listings** | Web marketplace | 199 one-time per listing, 999/yr unlimited | Bulk revenue, lower volume |
| **AdMob / in-feed sponsored** | Mobile only (Capacitor) | CPM 4-8 USD | Low margin, high volume |
| **Affiliate — pet food / insurance / vet** | Web banners + email | 5-20% per referral | Zero infra cost |

Rationale: freemium subscription is the load-bearer for ARR; breeder listings front-load revenue while user base grows; super-match and ads are pure upside.

## Stack decision

- **Stripe** is the right primary rail for web/subscription + breeder listings (UAE licensing via Stripe MENA).
- **RevenueCat** on top of StoreKit (iOS) / Play Billing (Android) once Capacitor builds ship — app-store policy requires IAP for digital goods. RevenueCat + Stripe server-side via entitlement sync is the idiomatic setup.
- **AdMob** via `@capacitor-community/admob` after v1 has 5k MAU. Skip on web (small revenue, big UX hit).
- **Affiliate** needs no SDK — plain links with UTM.

Current repo has **none** of these. Everything below is net-new.

## Integration steps (Stripe subscriptions, web first)

### 1. Database additions

Add to `packages/db/src/schema.ts`:
```ts
export const subscriptions = pgTable('subscriptions', {
  userId: text('user_id').primaryKey().references(() => users.id),
  stripeCustomerId: text('stripe_customer_id').notNull().unique(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: text('plan').notNull(),                    // 'plus_monthly' | 'plus_annual'
  status: text('status').notNull(),                // 'active' | 'past_due' | 'canceled' | 'trialing'
  currentPeriodEnd: timestamp('current_period_end'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const listingPayments = pgTable('listing_payments', {
  id: text('id').primaryKey(),                     // stripe session id
  userId: text('user_id').references(() => users.id),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  type: text('type').notNull(),                    // 'breeder_listing' | 'super_match_pack'
  createdAt: timestamp('created_at').defaultNow(),
});
```
Then `npm run db:generate && npm run db:migrate`.

### 2. Server route — `packages/server/src/routes/billing.ts` (scaffold)

```ts
import { Router } from 'express';
import Stripe from 'stripe';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import type { PetPawSphereDb } from '@petpawsphere/db';

export function billingRouter(db: PetPawSphereDb) {
  const router = Router();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' });

  router.post('/checkout/subscription', requireAuth, async (req: AuthRequest, res) => {
    const { plan } = req.body as { plan: 'plus_monthly' | 'plus_annual' };
    const priceId = plan === 'plus_annual'
      ? process.env.STRIPE_PRICE_PLUS_ANNUAL!
      : process.env.STRIPE_PRICE_PLUS_MONTHLY!;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: req.userId!,
      success_url: `${process.env.WEB_ORIGIN}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEB_ORIGIN}/billing/cancel`,
      allow_promotion_codes: true,
    });
    res.json({ url: session.url });
  });

  router.post('/checkout/listing', requireAuth, async (req: AuthRequest, res) => {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: process.env.STRIPE_PRICE_BREEDER_LISTING!, quantity: 1 }],
      client_reference_id: req.userId!,
      success_url: `${process.env.WEB_ORIGIN}/verify/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEB_ORIGIN}/verify`,
    });
    res.json({ url: session.url });
  });

  // Webhook — raw body required; mount BEFORE express.json() or use
  // router.use('/webhook', express.raw({ type: 'application/json' }))
  router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      return res.status(400).send(`Webhook signature failure: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.userId) || (event.data.object as any).client_reference_id;
        if (userId) {
          await db.insert(subscriptions).values({
            userId,
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: sub.id,
            plan: sub.items.data[0].price.lookup_key ?? 'plus_monthly',
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          }).onConflictDoUpdate({
            target: subscriptions.userId,
            set: { status: sub.status, stripeSubscriptionId: sub.id,
                   currentPeriodEnd: new Date(sub.current_period_end * 1000) },
          });
        }
        break;
      }
    }
    res.json({ received: true });
  });

  router.get('/me', requireAuth, async (req: AuthRequest, res) => {
    const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, req.userId!));
    res.json({ subscription: row ?? null });
  });

  return router;
}
```

Then in `api-server.ts`:
```ts
// Raw body ONLY on the webhook path — mount before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
// ...existing routers...
app.use('/api/billing', billingRouter(db));
```

### 3. Frontend paywall component

`packages/web/src/components/Paywall.tsx`:
```tsx
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function Paywall({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['billing:me', user?.id],
    queryFn: () => api.billing.me(),
    enabled: !!user,
  });
  const isActive = data?.subscription?.status === 'active' || data?.subscription?.status === 'trialing';
  if (isActive) return <>{children}</>;

  async function upgrade() {
    const { url } = await api.billing.checkoutSubscription('plus_monthly');
    window.location.href = url;
  }

  return (
    <div className="rounded-lg border p-6 text-center">
      <h3 className="text-lg font-semibold">Upgrade to PawMatch Plus</h3>
      <p className="text-sm text-gray-600">Unlock {feature} — 39 AED/mo, cancel anytime.</p>
      <button onClick={upgrade} className="mt-4 rounded-md bg-amber-600 px-4 py-2 text-white">
        Upgrade
      </button>
    </div>
  );
}
```

### 4. Features that should go behind the paywall

Reviewed current routes — gate these:

| Feature | File | Reason |
|---|---|---|
| Unlimited match requests | `/matches/new` (`MatchCreate.tsx`) | Free tier: 3 sent matches/mo |
| AI pet diagnostics | `/tools/diagnostic` (`Diagnostic.tsx`) | High Gemini cost; clear premium value |
| Vet document OCR | `/tools/document-scan` (`DocumentScan.tsx`) | High cost, niche value |
| Vet advisor (Genkit) | `/tools/vet-advisor` (`VetAdvisor.tsx`) | Same as above |
| Real-time translate for international chat | `/tools/translate` | Premium convenience |
| Breed detect | keep free | Acquisition hook |
| Verification badge | `/profile/verification` | One-time paid listing fee |

Super-match / boost: add a button on `PetDetail.tsx` that calls `/api/billing/checkout/boost` (separate Price ID, one-time mode).

### 5. Environment variables to add

```
STRIPE_SECRET_KEY=sk_test_...              # use sk_live in prod
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PLUS_MONTHLY=price_...
STRIPE_PRICE_PLUS_ANNUAL=price_...
STRIPE_PRICE_BREEDER_LISTING=price_...
STRIPE_PRICE_SUPER_MATCH=price_...
WEB_ORIGIN=https://pawmatch.ae
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...    # for stripe.js on client if needed
```

In Functions, bind via `firebase functions:secrets:set STRIPE_SECRET_KEY` (and the rest). Update `functions/src/index.ts` to include them in `secrets:` array.

### 6. Webhook endpoint for Stripe dashboard

`https://<host>/api/billing/webhook` — select events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Mobile (RevenueCat path)

Once the Capacitor iOS/Android build is in stores:
1. `npm i @revenuecat/purchases-capacitor`
2. Create RevenueCat project, link App Store Connect + Play Console, create "plus" entitlement
3. Mirror entitlements into Supabase via RevenueCat webhook → `/api/billing/revenuecat-webhook`
4. Same `<Paywall>` component — `isActive` check merges Stripe rows + RevenueCat rows keyed by `userId`

Apple policy: digital goods **must** use IAP in the iOS bundle, not Stripe. Web-only purchases are fine; the native app needs the IAP split.

## 30-day launch checklist ("deployed → first paying user")

| Day | Task |
|---|---|
| 1 | Register Stripe account (UAE or remote entity). Enable test mode. |
| 2 | Create 4 products + prices (plus_monthly, plus_annual, breeder_listing, super_match). Save `price_...` IDs. |
| 3 | Add `subscriptions` and `listing_payments` tables via Drizzle migration. Deploy. |
| 4 | Implement `billingRouter` (above). Unit-test webhook signature path. |
| 5 | Wire `<Paywall>` on the 4 routes listed. Ship to preview URL. |
| 6 | Verify with Stripe test cards (`4242 4242 4242 4242`, `4000 0000 0000 9995`). |
| 7 | Load-test webhook with `stripe trigger`. |
| 8 | Add `/billing/success` and `/billing/cancel` pages. |
| 9 | Add /account → "Manage subscription" (Stripe billing portal — `stripe.billingPortal.sessions.create`). |
| 10 | Run Stripe in live mode for one internal test purchase (refund it). |
| 11 | Add "Upgrade" CTA to dashboard hero. |
| 12 | Email capture on free-tier cap hit — send "upgrade" email via Postmark/Resend. |
| 13 | Add `billing_events` table for audit (before webhook noise grows). |
| 14 | Instrument PostHog: `subscription_started`, `checkout_abandoned`, `paywall_shown`. |
| 15 | Fraud guard: webhook idempotency via event.id store. |
| 16-20 | Soft launch to 50 beta users. Offer `PAWSLAUNCH50` 50% off coupon. Measure. |
| 21 | First listing upsell email to any user with a pet but no verification. |
| 22 | Add breeder-listing form + checkout flow. |
| 23 | Publish terms of service update — subscription + refund policy. |
| 24 | Stripe Radar rules — block known-risk countries for one-time listing fee. |
| 25 | Add annual plan discount banner (2 months free). |
| 26 | Affiliate program — sign up for one pet insurance affiliate (e.g., OmanInsurance UAE petcare rider) — embed on resources page. |
| 27-29 | Public launch — Product Hunt / UAE pet community groups. |
| 30 | First paying user acquired, refund tested, revenue recognized. |

Do **not** commit real keys. All values above are placeholders.
