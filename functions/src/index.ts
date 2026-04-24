import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from '../../packages/server/src/api-server';

// Express app is created once and reused across warm invocations
const app = createApp(process.env.DATABASE_URL!);

// me-central1 = Middle East (closest region to UAE)
export const api = onRequest({ region: 'me-central1' }, app);

// Monetization (dark-launched — no-op while MONETIZATION_ENABLED != "true")
export { createCheckoutSession } from './billing/createCheckoutSession';
export { stripeWebhook } from './billing/stripeWebhook';
