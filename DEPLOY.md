# PetPawSphere — DEPLOY (Firebase project `petapp-38f4a`)

## Prerequisites

- Firebase CLI installed: `npm i -g firebase-tools` (v13+)
- Logged in Google account with Editor/Owner on project `petapp-38f4a`
- Billing plan: **Blaze (pay-as-you-go)** — required for Cloud Functions v2 and outbound Postgres calls
- Supabase project accessible from Cloud Functions (no extra allowlist needed — Supabase is public by default)

## 1. Login & project select

```bash
firebase login
firebase use petapp-38f4a
firebase projects:list        # confirm it's set as default
```

`.firebaserc` already pins default → no `firebase use --add` needed.

## 2. Build

```bash
# From repo root
npm ci
npm run build --workspace=packages/web          # outputs packages/web/dist
(cd functions && npm ci && npm run build)        # outputs functions/lib/index.js
```

Both artifacts must exist before deploying.

> ⚠ Bug to fix before first deploy: `functions/esbuild.mjs` aliases `@pawmatch/db` but the workspace is published as `@petpawsphere/db`. If functions start failing to resolve the DB module, update the alias to `@petpawsphere/db`. (Currently the functions bundle pulls db from the relative path via the server import chain, so this may be latent.)

## 3. Deploy

```bash
firebase deploy --only hosting,functions --project petapp-38f4a
```

### Why not `firestore:rules` / `storage`?
The project does **not** use Firestore or Cloud Storage — persistence is Supabase PostgreSQL via Drizzle. `firebase.json` correctly omits those blocks. If you later add Firebase Storage for pet photos, you must:
1. Create `storage.rules` at repo root
2. Add a `"storage": { "rules": "storage.rules" }` block to `firebase.json`
3. Re-run `firebase deploy --only storage`

## 4. Required Google Cloud APIs

Enable on project `petapp-38f4a` (Firebase Console prompts for most, but verify):

| API | Why |
|---|---|
| Cloud Functions API | runs the `api` function |
| Cloud Build API | builds the function container |
| Artifact Registry API | stores the function image |
| Cloud Run Admin API | v2 functions run on Cloud Run |
| Eventarc API | v2 function triggers |
| Firebase Authentication API | ID-token verification |
| Firebase Hosting API | hosting deploy |
| Secret Manager API | recommended for `DATABASE_URL`, `GOOGLE_GENAI_API_KEY` |

Auth providers to enable in Firebase Console → Authentication → Sign-in method:
- Email/Password
- Google
- Apple (requires Apple Developer team ID + Services ID + key — see App Store notes)

## 5. Function runtime secrets

`functions/src/index.ts` reads `process.env.DATABASE_URL`. Do **not** hard-code it. Bind via Secret Manager:

```bash
firebase functions:secrets:set DATABASE_URL
firebase functions:secrets:set GOOGLE_GENAI_API_KEY
firebase functions:secrets:set ALLOWED_ORIGINS
```

Then update `functions/src/index.ts`:
```ts
import { defineSecret } from 'firebase-functions/params';
const DATABASE_URL = defineSecret('DATABASE_URL');
const GOOGLE_GENAI_API_KEY = defineSecret('GOOGLE_GENAI_API_KEY');
const ALLOWED_ORIGINS = defineSecret('ALLOWED_ORIGINS');

export const api = onRequest(
  { region: 'me-central1', secrets: [DATABASE_URL, GOOGLE_GENAI_API_KEY, ALLOWED_ORIGINS] },
  (req, res) => createApp(DATABASE_URL.value())(req, res),
);
```

(Not applied — this is a recommended edit for first prod deploy.)

## 6. DNS / custom domain

No CNAME/TXT records are referenced in the repo. Default Firebase domains will be:

- `petapp-38f4a.web.app`
- `petapp-38f4a.firebaseapp.com`

To wire `pawmatch.ae` (or chosen apex):
1. Firebase Console → Hosting → Add custom domain → enter apex or `www`
2. Add the TXT (ownership) and A/AAAA (or CNAME for `www`) records shown at your registrar (likely Namecheap/Cloudflare/Route 53)
3. Wait for provisioning (up to 24h; usually minutes). Firebase auto-issues a Let's Encrypt cert.
4. Update `ALLOWED_ORIGINS` secret to include `https://pawmatch.ae,https://www.pawmatch.ae`
5. Update `VITE_FIREBASE_AUTH_DOMAIN` if you want auth links to show your own domain (requires Identity Platform upgrade).

## 7. Post-deploy smoke tests

Replace `<host>` with `petapp-38f4a.web.app` (or your custom domain).

```bash
# 1. Static hosting
curl -I https://<host>/                                # expect 200, text/html
curl -I https://<host>/favicon-32.png                  # expect 200

# 2. SPA fallback
curl -I https://<host>/some/unknown/path               # expect 200 (rewrite to index.html)

# 3. Function health via hosting rewrite
curl https://<host>/api/resources                      # expect 200 JSON (public route)

# 4. Auth-required route denies anonymous
curl -i https://<host>/api/pets                        # expect 401 { "error": "Missing or invalid token" }

# 5. Security headers present
curl -I https://<host>/ | grep -Ei 'strict-transport|x-frame|referrer-policy'
```

Then in the browser:
- Load `/`, accept cookie banner, open DevTools → Network → confirm `firebase.googleapis.com` init succeeds
- Click **Sign in with Google** → completes round trip to `/api/auth/sync`
- Create a pet → appears in Supabase `pets` table

## 8. Dry-run executed

Steps 1–2 (login + build) were **not executed in this session** — user deferred the live build. `firebase login` and `firebase use` are safe to run at any time; the build command is documented above and runs green in CI on every push to `main`. Step 3 deploy is left to the operator.
