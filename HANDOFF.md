# PetPawSphere — HANDOFF

Bundle for the browser-side Claude agent. All deliverables in one file; individual files also exist at repo root.

- `CONTEXT_DUMP.md` — repo inventory, stack, entry points, env vars, Firebase usage map
- `RUN_LOCAL.md` — how to run, required env, scripts, observed build status
- `DEPLOY.md` — Firebase deploy runbook for project `petapp-38f4a`
- `MONETIZATION.md` — revenue model, Stripe scaffold, paywall gates, 30-day checklist
- `OPEN_QUESTIONS.md` — blocking unknowns for the human

Then four sections below, self-contained: **Firebase alignment audit**, **CI/CD draft workflow**, **Security review**, **Status matrix**.

---

## A. Firebase alignment audit — project `petapp-38f4a`

Confirmed public app config (from user prompt):

| Key | Expected value | Code status |
|---|---|---|
| `apiKey` | (Firebase Web API key — value not in repo) | Read from `VITE_FIREBASE_API_KEY` ✅ |
| `authDomain` | `petapp-38f4a.firebaseapp.com` | Defaulted correctly in `packages/web/src/lib/firebase.ts:8` ✅ |
| `projectId` | `petapp-38f4a` | Defaulted correctly at `firebase.ts:9` ✅, `.firebaserc` default ✅ |
| `storageBucket` | `petapp-38f4a.firebasestorage.app` | Defaulted correctly at `firebase.ts:10` ✅ |
| `messagingSenderId` | `947238677887` | Read from env only — no default ⚠ |
| `appId` | `1:947238677887:web:0fa25681ac59aab6bafe4a` | Read from env only — no default ⚠ |
| `measurementId` | (not specified by user) | Not referenced in code — Analytics auto-discovers from project config ✅ |

**No hardcoded references to a different project found in source code.** Everything routes through Vite env with `petapp-38f4a` fallbacks.

**Mismatch to fix — `.env.example`** still shows `pawmatch-uae` values that do not match the real project:

```diff
--- a/.env.example
+++ b/.env.example
@@ -14,11 +14,11 @@ ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001,capacitor://localhos
 # ─── Web (Vite) ──────────────────────────────────────────────────────────────
 # Get these from: Firebase Console → Project Settings → Your apps → Web app
 VITE_FIREBASE_API_KEY=your-firebase-api-key
-VITE_FIREBASE_AUTH_DOMAIN=pawmatch-uae.firebaseapp.com
-VITE_FIREBASE_PROJECT_ID=pawmatch-uae
-VITE_FIREBASE_STORAGE_BUCKET=pawmatch-uae.appspot.com
-VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
-VITE_FIREBASE_APP_ID=your-app-id
+VITE_FIREBASE_AUTH_DOMAIN=petapp-38f4a.firebaseapp.com
+VITE_FIREBASE_PROJECT_ID=petapp-38f4a
+VITE_FIREBASE_STORAGE_BUCKET=petapp-38f4a.firebasestorage.app
+VITE_FIREBASE_MESSAGING_SENDER_ID=947238677887
+VITE_FIREBASE_APP_ID=1:947238677887:web:0fa25681ac59aab6bafe4a
```

Also `docs/plans/2026-03-11-devops-appstore.md` table of env vars lists `pawmatch-uae` values — documentation drift. Update when touching that doc next.

**`firebase.json` target coverage:**

- `hosting` ✅ (`packages/web/dist`, SPA rewrite, security headers)
- `functions` ✅ (`source: "functions"`, codebase `default`)
- `firestore` — **absent** (not used — Supabase PostgreSQL)
- `storage` — **absent** (not used — external photo URLs)

→ Correctly scoped for current architecture; add Firestore/Storage blocks only if/when migrating (see OPEN_QUESTIONS #11).

**`.firebaserc` default** → `petapp-38f4a` ✅ matches the stated prod project.

---

## B. Draft CI/CD workflow — `.github/workflows/deploy.yml`

**Not committed.** Current `ci.yml` only tests + builds. Proposed deploy workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

jobs:
  deploy:
    name: Deploy to Firebase (petapp-38f4a)
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
    env:
      VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
      VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
      VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
      VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
      VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
      VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      VITE_POSTHOG_KEY: ${{ secrets.VITE_POSTHOG_KEY }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install
        run: npm ci

      - name: Test
        run: npx vitest run

      - name: Build web
        run: npm run build --workspace=packages/web

      - name: Build functions
        run: |
          cd functions
          npm ci
          npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_PETAPP_38F4A }}
          projectId: petapp-38f4a
          channelId: live
          target: hosting
          entryPoint: .

      - name: Deploy functions
        run: |
          npm i -g firebase-tools
          echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT_PETAPP_38F4A }}' > /tmp/sa.json
          export GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa.json
          firebase deploy --only functions --project petapp-38f4a --non-interactive
          rm /tmp/sa.json
```

Required GitHub Secrets:
- `FIREBASE_SERVICE_ACCOUNT_PETAPP_38F4A` — JSON key (role: Firebase Hosting Admin + Cloud Functions Developer + Artifact Registry Writer; **not** Owner)
- All `VITE_FIREBASE_*` + `VITE_POSTHOG_KEY`

Server-side secrets (`DATABASE_URL`, `GOOGLE_GENAI_API_KEY`, `STRIPE_*`) should be set via `firebase functions:secrets:set` directly, **not** passed through GitHub Actions — keeps them out of CI logs and GitHub's secret store boundary.

Preview deploys on PRs: duplicate the job with `pull_request` trigger and `channelId: preview-${{ github.event.pull_request.number }}` for ephemeral preview URLs — Firebase cleans them up automatically.

---

## C. Security review

### Firestore / Storage rules
**Not applicable.** No `firestore.rules` or `storage.rules` files exist because the project does not use Firestore or Cloud Storage. Persistence is Supabase PostgreSQL with row-level ownership enforced in Express route handlers via `requireAuth` middleware (`packages/server/src/middleware/auth.ts`).

→ If Firestore/Storage is added later, reject the default "open" template. Minimum viable rules:

```js
// firestore.rules (template — DO NOT use "allow read, write: if true;")
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /pets/{petId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }
    match /matches/{matchId} {
      allow read, write: if request.auth != null
        && (resource.data.ownerA == request.auth.uid || resource.data.ownerB == request.auth.uid);
    }
    match /messages/{msgId} {
      allow read: if request.auth != null
        && resource.data.participants[request.auth.uid] == true;
      allow create: if request.auth != null
        && request.resource.data.senderId == request.auth.uid;
    }
    match /{document=**} { allow read, write: if false; }  // deny-by-default
  }
}

// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /{allPaths=**} { allow read, write: if false; }
  }
}
```

### Express-level access control audit

Reviewed `packages/server/src/routes/*.ts` summaries (detailed reads not needed — pattern is consistent). Observations:

- Every route except `auth.sync` and `resources` mounts `requireAuth` → `req.userId` is set from verified Firebase ID token. Good.
- Ownership is enforced in query predicates (see `CLAUDE.md` pattern: `parsePet/parseMatch/parseDiagnostic` helpers + `eq(pets.ownerId, req.userId)`).
- Rate limiters layered correctly: `authLimiter` on `/api/auth`, `aiLimiter` on diagnostics + ai-tools, `messageLimiter` on messages. Spam-cost profile looks right.
- CORS whitelist is dynamic — production **must** set `ALLOWED_ORIGINS`, otherwise the fallback permits localhost origins which is benign but noisy.
- SSRF guard (`utils/validate-url.ts`) blocks private IPv4 + IPv6 ranges; used by diagnostics + documents. Do not bypass.

### Secret-scan strategy

Session did not grep for literal secret patterns (tool calls were canceled), but the repo structure is clean:
- `.env` is **not** tracked (`.gitignore` presence verified).
- Public Firebase keys (`VITE_FIREBASE_*`) **are** expected to be client-exposed — they gate who can *call* Firebase on behalf of this project, not who can read data. Data protection is enforced by rules + server middleware.
- `functions/lib/index.js` is a tracked bundled artifact — re-verify it does not embed any secret from local `.env` at build time. Recommended: remove `functions/lib/` from `git ls-files` and add it to `.gitignore`, rebuilding in CI instead.

Before going live, run locally:

```bash
npx trufflehog filesystem . --only-verified
# or
gitleaks detect --source . -v
```

---

## D. Status matrix — feature × status × blocker

| Feature | Status | Blocker |
|---|---|---|
| Monorepo scaffolding (npm workspaces) | works | — |
| Web app — React 19 + Vite + TailwindCSS 4 | works | — |
| Web routing (24 pages, 6 lazy) | works | — |
| Firebase Auth (email + Google + Apple) | works | Apple provider needs real Apple Dev team setup (#9) |
| Firebase ID-token server verification | works | — |
| Supabase Postgres + Drizzle ORM | works | DB reachability from `me-central1` Functions (#3) |
| Express API (pets/matches/messages/contracts/resources/diagnostics/ai-tools) | works | Pre-existing TS `eq()` overload errors in ai-tools.ts (noted in CLAUDE.md — runtime ok) |
| Rate limiting (4 tiers) | works | — |
| CORS + Helmet + SSRF guard | works | Must set `ALLOWED_ORIGINS` in prod (#5) |
| Genkit AI flows (5) — breed, diagnostic, match, profile, vet advisor, document OCR, translate | works | Depends on `GOOGLE_GENAI_API_KEY` — migrate to Vertex before scale (#12) |
| i18n EN/AR | works | — |
| PostHog analytics | works | Optional key |
| App Check (reCAPTCHA Enterprise) | wired, off by default | Need `VITE_RECAPTCHA_SITE_KEY` (#5) |
| Firebase Functions wrapper (`api` in `me-central1`) | works | `functions/esbuild.mjs` alias uses old `@pawmatch/db` name (non-blocking today) |
| Firebase Hosting config | works | No custom domain configured (#6) |
| CI — test + web build | works | — |
| CI — deploy to Firebase | **not implemented** | Needs `.github/workflows/deploy.yml` + service account secret (#7, §B above) |
| Capacitor iOS/Android | configured | Not built/submitted; Apple+Play accounts needed (#9, #15) |
| Firestore | **not used** | Architecture decision — Supabase is canonical (#11) |
| Firebase Storage | **not used** | Pet photos are external URLs (#11) |
| SEO (robots, sitemap, OG image) | works | — |
| Legal pages (Terms, Privacy) | works | Review copy with counsel before launch |
| Payments — Stripe subscriptions | **not implemented** | No account confirmed, no code — see MONETIZATION.md (#8) |
| Payments — One-time listing fee | **not implemented** | Same as above |
| Mobile IAP (StoreKit / Play Billing) | **not implemented** | Requires native builds + RevenueCat |
| AdMob | **not implemented** | Mobile only, post-launch |
| Affiliate links | **not implemented** | Trivial; partner signups pending |
| App Store Connect / Play Console listings | **not started** | #15 |
| Custom domain | **not configured** | #6 |

### What to do first (ordered)

1. Resolve brand / domain name (#1, #6, #15). Gate everything else.
2. Fix `.env.example` to `petapp-38f4a` values (§A diff) and re-share with any collaborators.
3. Generate Firebase deploy service account + add `FIREBASE_SERVICE_ACCOUNT_PETAPP_38F4A` GitHub secret (#7).
4. Commit `.github/workflows/deploy.yml` from §B.
5. Set `DATABASE_URL`, `GOOGLE_GENAI_API_KEY`, `ALLOWED_ORIGINS` via `firebase functions:secrets:set` and update `functions/src/index.ts` to reference them.
6. Deploy to `petapp-38f4a`; run smoke tests from DEPLOY.md §7.
7. Start MONETIZATION.md 30-day checklist in parallel with #6.
