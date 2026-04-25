# OPEN QUESTIONS — for the human / browser agent

Blocking or near-blocking unknowns uncovered while producing the handoff. Resolve these before first paid-prod deploy.

## Identity / naming

1. **Repo vs Firebase project name mismatch.** GitHub repo is `petpawsphere`, app appears in code as `PetPawSphere` / `PetPawSphere`, Firebase project is `petapp-38f4a`. Is the production brand **PetPawSphere**, **PetPawSphere**, or something else? Locking this down affects: auth domain display name, Apple Services ID, App Store listing, domain purchase.
2. `.env.example` still references `petpawsphere.firebaseapp.com` / `petpawsphere.appspot.com` while the real project is `petapp-38f4a`. Should `.env.example` be updated to `petapp-38f4a.*` (canonical) or is `petpawsphere` the intended project and `petapp-38f4a` just a dev sandbox?

## Infrastructure

3. **Is the Supabase Postgres instance already provisioned and reachable from `me-central1`?** `functions/src/index.ts` reads `DATABASE_URL` at cold start and makes a pooled Postgres connection. If the DB is in `ap-southeast-1` or `us-east-1`, each cold start pays ~200-400ms of RTT. Worth considering Supabase MEA region or Cloud SQL colocated in `me-central1`.
4. **Billing plan on `petapp-38f4a`.** Blaze is required for v2 functions. Confirm the plan is upgraded.
5. **App Check / reCAPTCHA key.** `VITE_RECAPTCHA_SITE_KEY` is optional today; without it, the API is exposed to bots at the Firebase Functions level once auth tokens are acquired. Should we enable App Check in enforcement mode before paid launch?
6. **Custom domain.** No CNAME/TXT records found in the repo. Which domain should Hosting map to — `petpawsphere.ae`, `petpawsphere.com`, or another? Who owns the registrar?

## Secrets & security

7. **Service account JSON handling.** For CI/CD deploy (see proposed workflow), we need a GitHub secret `FIREBASE_SERVICE_ACCOUNT_PETAPP_38F4A` containing a JSON key for a deploy service account. Who generates and stores it? It should scope to `roles/firebasehosting.admin` + `roles/cloudfunctions.developer` + `roles/artifactregistry.writer`, **not** Owner.
8. **Stripe account status.** Does Taas-ai have a Stripe account (MENA entity) already? If not, onboarding is 2-5 business days and gates the monetization rollout.
9. **Apple Developer + Google Play accounts.** Needed for iOS/Android builds via Capacitor and for IAP. Paid Apple ($99/yr) and Google ($25 one-time) accounts required.
10. Any real API keys in `.env` today? This session did not inspect `.env` values (read denied). Before pushing any CI, run `git secrets --scan` or `trufflehog` on the repo once to confirm nothing leaked. The tracked file `functions/lib/index.js` is bundled code — re-verify it does not embed secrets.

## Product / scope

11. **Are Firestore and Firebase Storage on the roadmap?** Currently unused. If pet photo uploads will move off external URLs onto Firebase Storage, we need `storage.rules`, a `storage` block in `firebase.json`, and client-side `firebase/storage` integration. Decide now or defer.
12. **Genkit → Vertex AI migration.** `.env.example` notes a Phase 4 TODO to move off `GOOGLE_GENAI_API_KEY` to `@genkit-ai/vertexai` (billed through Firebase). Is this scheduled before or after first paid user?
13. **Monetization model sign-off.** MONETIZATION.md proposes freemium + one-time listings + IAP boosts + ads + affiliate. Which of these are in-scope for the first 30 days vs. later?
14. **UAE VAT & invoicing.** Stripe can handle 5% VAT and VAT invoices for UAE entities (Stripe Tax). Do we need TRN registration and compliant invoices at launch, or is that deferred until revenue crosses the threshold?

## App store status

15. Are there App Store Connect / Google Play Console listings started yet? Bundle ID in Capacitor is `com.petpawsphere.app` — is that reserved on both stores, or does it need to be re-registered as `ae.petpawsphere.app` to match the brand?
