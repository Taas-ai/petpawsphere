# PetPawSphere / PetPawSphere — CONTEXT DUMP

_Generated 2026-04-20. Repo state at HEAD `05b3034`._

## 1. Git state

```
$ git remote -v
origin  https://github.com/Taas-ai/petpawsphere.git (fetch)
origin  https://github.com/Taas-ai/petpawsphere.git (push)

$ git log --oneline -20
05b3034 docs(sales): add Year 1 sales ops pipeline — targets, sequences, CRM workflows
d525b34 feat: Firebase Auth migration, PostgreSQL, CI/CD, Apache 2.0 license
9389179 launch: add SEO, legal pages, security headers, and .env docs
60d5a7e feat: add diagnostic/OCR pages, social login buttons, lazy loading
a1494ff security: fix critical and high vulnerabilities from OWASP audit
f0e6d26 feat: add AI pet diagnostics and vet document OCR
b2e8659 refactor: extract shared auth utilities, fix error handling, DRY test mocks
dcf0686 feat: add Google/Apple social login alongside JWT email/password auth
f07e048 feat: add Capacitor config for iOS and Android mobile builds
ba78571 feat: add E2E smoke test, dev startup with concurrently, fix route ordering
26f26d4 test: add flow tests with mocked Gemini for all 5 AI flows
c99be2b feat: add chat, profile, verification pages and Arabic/English i18n
4ce8d08 feat: add pet, match, and AI tool pages with compatibility card
b4b1081 feat: add React frontend with Vite, auth, routing, landing page, and dashboard
6806006 feat: add matches, messages, AI tools, contracts, and resources API routes
3617958 feat: add auth API (JWT) and pets CRUD with ownership checks and tests
741afcc feat: add Drizzle schema (6 tables), seed data, fixtures, and DB tests
87f260c refactor: convert to npm workspaces monorepo
cc885aa initial: existing Genkit MCP server with 5 AI flows

$ git branch -a
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/main
```

## 2. File tree (git ls-files, node_modules/dist excluded by git)

134 tracked files. Top-level groupings:

```
.github/workflows/ci.yml
.github/ISSUE_TEMPLATE/{bug_report,feature_request}.yml
.github/PULL_REQUEST_TEMPLATE.md
.env.example
.firebaserc
.mcp.json
firebase.json
package.json                        (npm workspaces root)
package-lock.json
tsconfig.json
vitest.config.ts
AGENTS.md  CLAUDE.md  CONTRIBUTING.md  LICENSE  README.md  SECURITY.md
pet-mating-app-prd.md               (original product spec)
fixtures/sample-data.ts

docs/plans/
  2026-03-07-petpawsphere-fullplatform-design.md
  2026-03-07-petpawsphere-implementation.md
  2026-03-09-diagnostic-ocr-design.md
  2026-03-09-launch-readiness-report.md
  2026-03-11-devops-appstore.md
  2026-sales-ops-pipeline.md

functions/
  package.json   tsconfig.json   esbuild.mjs
  src/index.ts                         (Firebase Functions entry)
  lib/index.js                         (built artifact)

packages/db/
  drizzle.config.ts   package.json   tsconfig.json
  src/{index.ts,schema.ts,seed.ts}
  migrations/0000_fantastic_sinister_six.sql   meta/_journal.json
  tests/schema.test.ts

packages/server/
  package.json   tsconfig.json
  src/api-server.ts  genkit.ts  mcp-server.ts
  src/middleware/auth.ts
  src/routes/{auth,pets,matches,messages,ai-tools,contracts,resources,diagnostics}.ts
  src/flows/{breed-detect,pet-diagnostic,pet-match,profile-review,translate,vet-advisor,vet-document-ocr}.ts
  src/utils/{user,validate-url}.ts
  tests/{api,flows,e2e,helpers}/*

packages/web/
  index.html  package.json  tsconfig.json  vite.config.ts  capacitor.config.ts
  public/{favicon-32.png,apple-touch-icon.png,og-image.png,robots.txt,sitemap.xml}
  src/main.tsx  App.tsx  index.css
  src/components/{Navbar,PetCard,CompatibilityCard,ChatBubble,ProtectedRoute,CookieBanner}.tsx
  src/lib/{api,auth-context,firebase,posthog,capacitor,utils}.{ts,tsx}
  src/i18n/{index.ts,en.json,ar.json}
  src/pages/*                                 (~24 route components)
```

## 3. Key config file contents

### `package.json` (root)
- `"private": true`, npm workspaces = `["packages/*"]`
- Scripts: `dev` (concurrently server+web), `build` (all workspaces), `test` (vitest), `db:{generate,migrate,seed}`, `mcp`, `genkit:dev`, `mobile:{sync,ios,android}`
- No `engines` field. DevDeps: `concurrently`, `esbuild`, `typescript` 5.9, `vitest` 3.1

### `packages/web/package.json`
- Vite 6 + React 19 + TailwindCSS 4, `firebase` 11.10, `posthog-js`, `@tanstack/react-query`, `react-router-dom` 7, `react-hook-form` + `zod`, `i18next` + `react-i18next`
- Capacitor 8 (iOS + Android) for mobile wrapper

### `packages/server/package.json`
- `"type": "commonjs"`, main `dist/api-server.js`
- Runtime: `express`, `helmet`, `cors`, `express-rate-limit`, `firebase-admin` 12, Drizzle via workspace
- Genkit stack: `@genkit-ai/express`, `@genkit-ai/google-genai`, `@genkit-ai/mcp`, `@modelcontextprotocol/sdk`
- Dev: `tsx watch`, Vitest + Supertest

### `packages/db/package.json`
- `drizzle-orm` + `postgres` (Supabase)
- `drizzle-kit generate/migrate`, `tsx src/seed.ts`

### `functions/package.json`
- `engines: { "node": "20" }`
- `firebase-admin` 12, `firebase-functions` 6
- Build: `node esbuild.mjs` → `lib/index.js` (bundled CJS, externalises firebase SDKs)

### `firebase.json`
```json
{
  "hosting": {
    "public": "packages/web/dist",
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [ /* long-cache js/css/woff2 + security headers
                   (X-Frame-Options DENY, nosniff, Referrer-Policy,
                    Permissions-Policy, HSTS) */ ]
  },
  "functions": [
    { "source": "functions", "codebase": "default",
      "ignore": ["node_modules", ".git", "firebase-debug.log"] }
  ]
}
```
> ⚠ No `firestore` or `storage` blocks, no `firestore.rules`, no `storage.rules`, no `firestore.indexes.json`. The app does NOT use Firestore — persistence is Supabase PostgreSQL via Drizzle.

### `.firebaserc`
```json
{ "projects": { "default": "petapp-38f4a" } }
```

### `tsconfig.json` (root)
Project references to `packages/db` and `packages/server`; strict, ES2022, esModuleInterop, skipLibCheck.

### `vite.config.ts`
```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../../',                         // reads root .env
  resolve: { alias: { '@': './src' } },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } },
});
```

### `.github/workflows/ci.yml`
Two jobs on push/PR to main:
1. **test** — `npm ci` then `npx vitest run`
2. **build** — `npm run build --workspace=packages/web` with `VITE_FIREBASE_*` passed from GitHub secrets. `needs: test`.
No deploy job.

## 4. Env var NAMES (keys only)

Referenced in code:
```
# Server
DATABASE_URL                   (Supabase Postgres connection string)
PORT
NODE_ENV
ALLOWED_ORIGINS                (CSV for CORS)
FIREBASE_PROJECT_ID            (local dev only; Functions auto-init)
GOOGLE_APPLICATION_CREDENTIALS (optional local service-account path)
GOOGLE_GENAI_API_KEY           (Gemini; TODO: migrate to Vertex via Firebase)

# Web (Vite-exposed, PUBLIC)
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_RECAPTCHA_SITE_KEY        (App Check; optional)
VITE_POSTHOG_KEY
VITE_POSTHOG_HOST              (optional)
VITE_API_URL                   (used by Capacitor native builds)
```

GitHub Actions secrets (from `ci.yml`): all `VITE_FIREBASE_*` mirrored.

## 5. Entry points (first ~80 lines)

### `functions/src/index.ts` (9 lines)
```ts
import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from '../../packages/server/src/api-server';
const app = createApp(process.env.DATABASE_URL!);
export const api = onRequest({ region: 'me-central1' }, app);
```
Region `me-central1` (Dammam/UAE) selected for latency.

### `packages/server/src/api-server.ts`
`createApp(dbOrUrl)` builds Express app with:
- `helmet()`, dynamic CORS whitelist from `ALLOWED_ORIGINS`
- JSON body limit `1mb`
- Four rate limiters: `apiLimiter` 100/15min, `authLimiter` 10/15min, `aiLimiter` 20/hr, `messageLimiter` 10/min
- Routers mounted: `/api/auth`, `/api/pets`, `/api/matches`, `/api/messages`, `/api/resources`, `/api` (diagnostics + ai-tools), `/api/contracts`
- Stand-alone listen guard at bottom (only when run directly via tsx)

### `packages/web/src/main.tsx`
```tsx
initPostHog();
createRoot(...).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
```

### `packages/web/src/App.tsx`
24 route components, 6 lazy-loaded (BreedDetect, Translate, VetAdvisor, Diagnostic, DocumentScan, MatchCreate). `Navbar` + `CookieBanner` always rendered. Auth gating via `<ProtectedRoute>`.

### `packages/web/src/lib/firebase.ts`
`initializeApp(firebaseConfig)` with fallback defaults to `petapp-38f4a` project (`petapp-38f4a.firebaseapp.com`, `petapp-38f4a.firebasestorage.app`). If `apiKey` missing, a stub app is created so UI still renders. App Check via reCAPTCHA Enterprise when `VITE_RECAPTCHA_SITE_KEY` set.

## 6. Firebase SDK usage map

| File | Imports | Purpose |
|---|---|---|
| `packages/web/src/lib/firebase.ts` | `firebase/app`, `firebase/auth`, `firebase/analytics`, `firebase/app-check` | Client init, auth, App Check, lazy analytics |
| `packages/web/src/lib/auth-context.tsx` | `firebase/auth` (`signInWith*`, `onAuthStateChanged`, `GoogleAuthProvider`, `OAuthProvider('apple.com')`, `signOut`) | React auth provider wrapping email+Google+Apple sign-in |
| `packages/web/src/components/CookieBanner.tsx` | `initAnalytics` from firebase.ts (indirect) | Lazy-inits Analytics after consent |
| `packages/server/src/middleware/auth.ts` | `firebase-admin` (`admin.auth().verifyIdToken`) | Bearer-token auth on every protected route |
| `functions/src/index.ts` | `firebase-functions/v2/https` (`onRequest`) | Wraps Express app as `api` function in `me-central1` |

## 7. Derived resource usage

- **Auth flow** — Client signs in via Firebase (email/password, Google popup, Apple popup) → obtains ID token → calls `POST /api/auth/sync` with token in `Authorization: Bearer` header → server verifies via Admin SDK → upserts user row in Postgres `users` table → returns app-level user (id, email, name, emirate, role). Subsequent API calls also carry the Firebase ID token.
- **Firestore collections** — None. App persists to Supabase PostgreSQL via Drizzle. Tables (from `packages/db/src/schema.ts` and migration `0000_*`): `users`, `pets`, `matches`, `messages`, `contracts`, `diagnostics` (~6 tables).
- **Storage buckets** — `VITE_FIREBASE_STORAGE_BUCKET` is set but no `firebase/storage` imports found. Pet photos are referenced by URL (`photoUrls` JSON column). Upload path not yet wired to Firebase Storage; assume external URLs for now.
- **Cloud Functions list** — single function `api` (HTTPS, `me-central1`). No scheduled/pubsub functions.

## 8. Payments / monetization code

**None implemented.** No Stripe, RevenueCat, Paddle, AdMob, or IAP imports in the source tree. Mentions of "stripe/subscription" only appear in:
- `docs/plans/2026-03-11-devops-appstore.md` (future plan)
- `docs/plans/2026-sales-ops-pipeline.md` (revenue targets, not code)
- `.github/workflows/ci.yml` (unrelated word match in job name)
- `package-lock.json` (indirect dep names)
- `README.md` (roadmap section)

→ Paywall / checkout / webhooks are all greenfield.
