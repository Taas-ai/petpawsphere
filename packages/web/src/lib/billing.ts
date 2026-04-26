import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from './firebase';

const MONETIZATION_ENABLED =
  (import.meta.env.VITE_MONETIZATION_ENABLED as string | undefined) === 'true';

export type SubscriptionStatus = {
  active: boolean;
  plan: string | null;
  currentPeriodEnd: string | null;
} | null;

/**
 * Opens a Stripe Checkout session for the given price.
 * No-ops and returns null while MONETIZATION_ENABLED is false.
 */
export async function createCheckoutSession(
  priceId: string,
  petId?: string,
): Promise<{ url: string } | null> {
  if (!MONETIZATION_ENABLED) return null;
  if (!auth.currentUser) throw new Error('Not signed in');

  const functions = getFunctions(app, 'me-central1');
  const call = httpsCallable<
    { priceId: string; petId?: string },
    { url: string }
  >(functions, 'createCheckoutSession');
  const res = await call({ priceId, petId });
  return res.data;
}

/**
 * Returns the current user's subscription status.
 * No-ops and returns null while MONETIZATION_ENABLED is false.
 */
export async function getSubscriptionStatus(_uid: string): Promise<SubscriptionStatus> {
  if (!MONETIZATION_ENABLED) return null;
  // Reads through the existing Express API once /api/billing/me is added.
  // Placeholder until the server route lands.
  return null;
}

export const isMonetizationEnabled = () => MONETIZATION_ENABLED;
