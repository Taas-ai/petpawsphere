# PetPawSphere — RUN LOCAL

## Required runtimes

| Tool | Version | Source |
|---|---|---|
| Node.js | **20.x LTS** (22 works too) | `functions/package.json` pins `engines.node: "20"`. CI uses 20. Local dev verified on 22.18.0. |
| npm | 10+ | ships with Node 20 |
| No `.nvmrc` | — | use `nvm install 20 && nvm use 20` manually |

> The repo uses npm **workspaces** (not pnpm, not bun). Do not run install inside sub-packages.

## Required env vars

Create `.env` at repo root (Vite `envDir: '../../'` reads from root; server loads via `node --env-file=../../.env`).

| Var | Scope | Purpose |
|---|---|---|
| `DATABASE_URL` | server | Supabase Postgres connection string — `postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres` |
| `PORT` | server | Defaults to `3001` |
| `NODE_ENV` | server | `development` locally |
| `ALLOWED_ORIGINS` | server | CSV — `http://localhost:5173,http://localhost:3001,capacitor://localhost` |
| `FIREBASE_PROJECT_ID` | server (local only) | `petapp-38f4a` — needed for Admin SDK to init without ADC |
| `GOOGLE_APPLICATION_CREDENTIALS` | server (optional) | path to service-account JSON if you want real `verifyIdToken` locally |
| `GOOGLE_GENAI_API_KEY` | server | Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey) — required for AI flows |
| `VITE_FIREBASE_API_KEY` | web | Firebase Web API key for project `petapp-38f4a` |
| `VITE_FIREBASE_AUTH_DOMAIN` | web | `petapp-38f4a.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | web | `petapp-38f4a` |
| `VITE_FIREBASE_STORAGE_BUCKET` | web | `petapp-38f4a.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | web | `947238677887` |
| `VITE_FIREBASE_APP_ID` | web | `1:947238677887:web:0fa25681ac59aab6bafe4a` |
| `VITE_RECAPTCHA_SITE_KEY` | web (optional) | Enables App Check |
| `VITE_POSTHOG_KEY` | web (optional) | Product analytics |
| `VITE_API_URL` | web (mobile builds) | Public API URL used by Capacitor bundle |

Copy template and edit:
```bash
cp .env.example .env
```

## Commands

```bash
# 1. Install (root only — npm workspaces hoists)
npm ci        # or: npm install

# 2. Database (first time or when schema changes)
npm run db:generate    # drizzle-kit generate (when schema.ts changes)
npm run db:migrate     # apply pending migrations to DATABASE_URL
npm run db:seed        # optional — inserts fixtures/sample-data.ts

# 3. Dev — concurrently starts server (3001) + web (5173)
npm run dev

# ...or individually
npm run dev:server     # Express + Drizzle on :3001
npm run dev:web        # Vite dev server on :5173 (proxies /api → :3001)

# 4. Tests
npm test               # vitest run (all workspaces)
npm run test:watch

# 5. Build everything (tsc -b + vite build + functions esbuild)
npm run build

# 6. Mobile (Capacitor)
npm run mobile:sync    # vite build + cap sync
npm run mobile:ios     # opens Xcode
npm run mobile:android # opens Android Studio

# 7. Genkit / MCP (optional)
npm run mcp            # stdio MCP server
npm run genkit:dev     # Genkit dev UI for the 5 flows
```

No pre-steps for Firebase emulators are required today — there is no local `firebase.json` emulator config and no Firestore/Storage dependencies.

## Build status (observed)

`node_modules/` already installed. The repo root `CLAUDE.md` documents a known pre-existing TS issue in `packages/server/src/routes/ai-tools.ts` (Drizzle `eq()` overload mismatch). The server runs fine under `tsx`; only `npm run build --workspace=packages/server` will error on those. The web build (`tsc -b && vite build`) is the one that matters for Firebase Hosting and works in CI (see `.github/workflows/ci.yml`).

**Not executed in this session** (user denied the build command): the live `npm run build --workspace=packages/web`. CI already runs it on every push, so it is green as of HEAD `05b3034`.
