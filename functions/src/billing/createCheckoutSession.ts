import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const WEB_ORIGIN = defineString('WEB_ORIGIN', { default: 'https://petapp-38f4a.web.app' });
const MONETIZATION_ENABLED = defineString('MONETIZATION_ENABLED', { default: 'false' });

interface Payload {
  priceId: string;
  petId?: string;
}

export const createCheckoutSession = onCall<Payload>(
  { region: 'me-central1', secrets: [STRIPE_SECRET_KEY] },
  async (req) => {
    if (MONETIZATION_ENABLED.value() !== 'true') {
      throw new HttpsError('failed-precondition', 'Monetization is disabled');
    }
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required');
    }

    const { priceId, petId } = req.data;
    if (!priceId) throw new HttpsError('invalid-argument', 'priceId is required');

    const stripe = new Stripe(STRIPE_SECRET_KEY.value(), { apiVersion: '2024-11-20.acacia' });
    const origin = WEB_ORIGIN.value();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: req.auth.uid,
      metadata: {
        userId: req.auth.uid,
        petId: petId ?? '',
        kind: 'boost_24h',
      },
      success_url: `${origin}/pets/${petId ?? ''}?boost=success`,
      cancel_url: `${origin}/pets/${petId ?? ''}?boost=cancelled`,
    });

    if (!session.url) {
      throw new HttpsError('internal', 'Stripe did not return a checkout URL');
    }
    return { url: session.url };
  },
);
