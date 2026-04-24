# PetPawSphere — Claude Code Context

## Dev Commands

```bash
# Server (MUST use --env-file — tsx watch does not auto-load .env)
cd packages/server && node --env-file=../../.env ../../node_modules/.bin/tsx watch src/api-server.ts

# Web
cd packages/web && npm run dev

# Tests
npm test
```

## Architecture
- `packages/web` — React/Vite frontend (port 5173), proxies `/api` → 3001
- `packages/server` — Express + Drizzle ORM (port 3001)
- `packages/db` — Drizzle schema + migrations (Supabase PostgreSQL)
- `functions/` — Firebase Functions wrapper around Express app
- Auth: Firebase client SDK (web) + `firebase-admin` token verification (server)

## Critical Patterns

### JSON text columns (Postgres)
Array columns (`healthRecords`, `photoUrls`, `warnings`, `breedingTips`, etc.) are stored as `JSON.stringify(array)`.
Always deserialize before sending HTTP responses using the shared helpers:
```typescript
import { parsePet, parseMatch, parseDiagnostic } from '../utils/parse-json';
```
Never add inline `JSON.parse` for HTTP responses — use these helpers.

### Firebase Admin init
In `middleware/auth.ts` — auto-initializes in Firebase Functions. For local dev, set `FIREBASE_PROJECT_ID` in `.env`.

### Rate limiters
Three tiers in `api-server.ts`: `apiLimiter` (100/15min), `authLimiter` (10/15min), `aiLimiter` (20/hr), `messageLimiter` (10/min).

## Pre-existing TypeScript Errors (Do Not Chase)
`packages/server/src/routes/ai-tools.ts` has Drizzle `eq()` overload mismatches — pre-existing, server runs fine via `tsx`.
All route files have similar `string | string[]` Express query param warnings — expected.

## Analytics
PostHog initialized in `packages/web/src/lib/posthog.ts`. Requires `VITE_POSTHOG_KEY` in `.env`.
Key events: `user_signed_up/in/out`, `pet_created`, `match_requested/accepted/rejected`, `message_sent`, `translate_used`.

## Security Notes
- Input validation: species/gender whitelist in `GET /pets`; photoUrls max 20; contract terms ≤5000 chars
- SSRF protection: `utils/validate-url.ts` — blocks private IPv4 + IPv6 ranges; used by diagnostics/documents routes
- Do NOT add raw `imageUrl` fetching without going through `validateImageUrl()`
