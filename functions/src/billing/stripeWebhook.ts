import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import Stripe from 'stripe';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as schema from '../../../packages/db/src/schema';

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const DATABASE_URL = defineSecret('DATABASE_URL');
const MONETIZATION_ENABLED = defineString('MONETIZATION_ENABLED', { default: 'false' });

let dbSingleton: ReturnType<typeof drizzle> | null = null;
function getDb() {
  if (!dbSingleton) {
    const client = postgres(DATABASE_URL.value());
    dbSingleton = drizzle(client, { schema });
  }
  return dbSingleton;
}

export const stripeWebhook = onRequest(
  {
    region: 'me-central1',
    secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DATABASE_URL],
  },
  async (req, res) => {
    if (MONETIZATION_ENABLED.value() !== 'true') {
      res.status(503).send('Monetization disabled');
      return;
    }

    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY.value(), { apiVersion: '2024-11-20.acacia' });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        (req as unknown as { rawBody: Buffer }).rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET.value(),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      res.status(400).send(`Webhook signature verification failed: ${msg}`);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const petId = session.metadata?.petId;
          const kind = session.metadata?.kind;

          if (kind === 'boost_24h' && userId && petId) {
            const startsAt = new Date();
            const expiresAt = new Date(startsAt.getTime() + 24 * 60 * 60 * 1000);
            await getDb()
              .insert(schema.boosts)
              .values({
                id: session.id,
                petId,
                userId,
                stripeSessionId: session.id,
                startsAt: startsAt.toISOString(),
                expiresAt: expiresAt.toISOString(),
              })
              .onConflictDoNothing({ target: schema.boosts.stripeSessionId });
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          const userId = (sub.metadata as { userId?: string } | undefined)?.userId;
          if (!userId) break;

          const plan = sub.items.data[0]?.price.lookup_key ?? 'plus_monthly';
          const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();

          await getDb()
            .insert(schema.subscriptions)
            .values({
              userId,
              stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
              stripeSubscriptionId: sub.id,
              plan,
              status: sub.status,
              currentPeriodEnd,
            })
            .onConflictDoUpdate({
              target: schema.subscriptions.userId,
              set: {
                stripeSubscriptionId: sub.id,
                plan,
                status: sub.status,
                currentPeriodEnd,
                updatedAt: sql`now()`,
              },
            });
          break;
        }

        default:
          // Unhandled event types are acknowledged so Stripe stops retrying.
          break;
      }

      res.json({ received: true });
    } catch (err) {
      console.error('[stripeWebhook] handler error', err);
      res.status(500).send('Webhook handler error');
    }
  },
);
