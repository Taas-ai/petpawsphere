# PR-1: Launch Readiness Gap Closure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the genuine remaining launch-readiness gaps (Sentry, profile update endpoint, image lazy-loading) and commit the pre-existing uncommitted readiness scaffold (Firebase Auth migration, legal pages, cookie banner, SEO, social login) that was never pushed since `05b3034`.

**Architecture:** Two-phase PR. **Phase A** ports the prior-session scaffold in clearly-labeled "port" commits (honest authorship — scaffold was authored in a prior session, not this one). **Phase B** adds new code with TDD cycles: Sentry on server + web, `PATCH /api/auth/me`, `loading="lazy"` on user-photo `<img>` tags. All stays dark-launched behind `MONETIZATION_ENABLED=false`.

**Tech Stack:** TypeScript, Express, Firebase Functions, Firebase Admin, Drizzle ORM, Supabase PostgreSQL, React 19, Vite, react-i18next, react-router-dom, @tanstack/react-query, Vitest, PostHog, Capacitor.

**Spec reference:** `docs/superpowers/specs/2026-04-23-launch-readiness-spec.md`

---

## File Structure Map

### Files ported in Phase A (exist in working directory, need first-commit)

```
# Project docs & plans
CLAUDE.md
DEPLOY.md
HANDOFF.md
RUN_LOCAL.md
CONTEXT_DUMP.md
OPEN_QUESTIONS.md
docs/plans/2026-03-11-devops-appstore.md
docs/plans/2026-phase2-strategy.md

# Build / CI / infra
.env.example
.firebaserc
.gitignore
.mcp.json
.serena/project.yml
README.md
firebase.json
package.json
package-lock.json
.github/workflows/ci.yml
.github/workflows/deploy.yml
functions/esbuild.mjs
functions/package.json
functions/package-lock.json
functions/src/index.ts

# Schema & server (Firebase Auth migration + routes)
packages/db/drizzle.config.ts
packages/db/package.json
packages/db/src/index.ts
packages/db/src/schema.ts
packages/server/package.json
packages/server/src/api-server.ts
packages/server/src/genkit.ts
packages/server/src/mcp-server.ts
packages/server/src/middleware/auth.ts
packages/server/src/routes/auth.ts
packages/server/src/routes/pets.ts
packages/server/src/routes/matches.ts
packages/server/src/routes/messages.ts
packages/server/src/routes/ai-tools.ts
packages/server/src/routes/contracts.ts
packages/server/src/routes/diagnostics.ts
packages/server/src/utils/validate-url.ts
packages/server/src/utils/parse-json.ts
packages/server/src/flows/breed-detect.ts
packages/server/src/flows/pet-diagnostic.ts
packages/server/src/flows/pet-match.ts
packages/server/src/flows/profile-review.ts
packages/server/src/flows/vet-advisor.ts
packages/server/src/flows/vet-document-ocr.ts
packages/server/tests/helpers/test-db.ts

# Web app core
packages/web/package.json
packages/web/capacitor.config.ts
packages/web/index.html
packages/web/tsconfig.json
packages/web/vite.config.ts
packages/web/src/App.tsx
packages/web/src/main.tsx
packages/web/src/i18n/index.ts
packages/web/src/lib/auth-context.tsx
packages/web/src/lib/capacitor.ts
packages/web/src/lib/firebase.ts
packages/web/src/lib/posthog.ts
packages/web/src/lib/billing.ts

# Web pages
packages/web/src/components/Navbar.tsx
packages/web/src/components/CookieBanner.tsx
packages/web/src/components/Paywall.tsx
packages/web/src/pages/Landing.tsx
packages/web/src/pages/Login.tsx
packages/web/src/pages/Register.tsx
packages/web/src/pages/Privacy.tsx
packages/web/src/pages/Terms.tsx
packages/web/src/pages/ChatThread.tsx
packages/web/src/pages/Diagnostic.tsx
packages/web/src/pages/DocumentScan.tsx
packages/web/src/pages/MatchCreate.tsx
packages/web/src/pages/MatchDetail.tsx
packages/web/src/pages/PetCreate.tsx
packages/web/src/pages/PetDetail.tsx
packages/web/src/pages/PetEdit.tsx
packages/web/src/pages/Translate.tsx

# SEO + public assets
packages/web/public/robots.txt
packages/web/public/sitemap.xml
packages/web/public/og-image.png
packages/web/public/apple-touch-icon.png
packages/web/public/favicon-32.png

# Monetization scaffold (dark-launched; PR-2 extends)
functions/src/billing/createCheckoutSession.ts
functions/src/billing/stripeWebhook.ts
```

### Files created or modified in Phase B (new work)

```
# New
packages/server/src/lib/sentry.ts               # server-side Sentry init
packages/web/src/lib/sentry.ts                   # web-side Sentry init
packages/server/tests/api/auth-profile-update.test.ts
packages/server/tests/lib/sentry.test.ts
packages/web/tests/lib/sentry.test.ts

# Modified
packages/server/src/routes/auth.ts               # add PATCH /me
packages/server/src/api-server.ts                # wire Sentry before helmet
packages/web/src/main.tsx                        # wire initSentry() before initPostHog()
packages/web/src/pages/Profile.tsx               # wire PATCH /me, remove "Coming soon"
packages/web/src/lib/billing.ts                  # no changes (PR-2 extends)
packages/web/src/pages/PetDetail.tsx             # loading="lazy" on <img>
packages/web/src/pages/MatchDetail.tsx           # loading="lazy" on <img>
packages/web/src/pages/MatchesList.tsx           # loading="lazy" on <img> (if any)
packages/web/src/pages/BreedDetect.tsx           # loading="lazy" on preview <img>
packages/server/package.json                    # add @sentry/node
packages/web/package.json                        # add @sentry/react
.env.example                                      # add SENTRY_DSN, VITE_SENTRY_DSN
```

---

## Task 0: Branch + starting-state verification

**Files:** none (git operations only)

- [ ] **Step 0.1: Create PR-1 feature branch**

Run: `cd "/Users/taurus_ai/Desktop/JACOBS's Projects/PetPawSphere" && git checkout -b feat/pr1-readiness-gaps`

Expected: `Switched to a new branch 'feat/pr1-readiness-gaps'`

- [ ] **Step 0.2: Confirm HEAD matches expected starting commit**

Run: `git log --oneline -1`

Expected (prefix): `30ba59d docs: add PR-1 implementation plan` (the plan commit itself). Parent should be `f079342` (spec commit).

If HEAD is neither of those SHAs, stop and investigate — scaffold assumptions may be invalid.

- [ ] **Step 0.3: Snapshot untracked file count**

Run: `git status --short | wc -l`

Record the number. After Phase A it should be near 0 (only build artifacts, screenshots, .codemap).

---

## Phase A: Port prior-session scaffold

Each Phase A task is a single `git add` + `git commit`. File contents already exist on disk from prior-session work — these tasks commit them with honest provenance.

**Author attribution pattern** — every Phase A commit uses:

```
chore: port <group> from prior session

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Task A.1: Port project docs & long-form plans

**Files:** 8 top-level docs + 2 plan docs

- [ ] **Step A.1.1: Stage docs**

Run:

```bash
git add CLAUDE.md DEPLOY.md HANDOFF.md RUN_LOCAL.md CONTEXT_DUMP.md OPEN_QUESTIONS.md \
  docs/plans/2026-03-11-devops-appstore.md \
  docs/plans/2026-phase2-strategy.md
```

- [ ] **Step A.1.2: Verify staged set**

Run: `git diff --cached --name-only`

Expected: exactly the 8 files above. If extras appear, `git restore --staged <extra>`.

- [ ] **Step A.1.3: Commit**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: port project docs and long-form plans from prior session

Adds CLAUDE.md (project memory), RUN_LOCAL.md, DEPLOY.md, HANDOFF.md,
CONTEXT_DUMP.md, OPEN_QUESTIONS.md, plus the devops-appstore and
phase2-strategy planning docs authored in an earlier session but never
committed. Content unchanged from working directory.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: `[feat/pr1-readiness-gaps <sha>] chore: port project docs and long-form plans from prior session`

---

### Task A.2: Port build/CI/Firebase/infra config

**Files:** package manifests, firebase config, github workflows, .env.example, .gitignore

- [ ] **Step A.2.1: Stage infra files**

Run:

```bash
git add .env.example .firebaserc .gitignore .mcp.json .serena/project.yml README.md \
  firebase.json package.json package-lock.json \
  .github/workflows/ci.yml .github/workflows/deploy.yml \
  functions/esbuild.mjs functions/package.json functions/package-lock.json
```

- [ ] **Step A.2.2: Verify no secret values in .env.example**

Run: `git diff --cached -- .env.example | grep -E "^\+(.*=)(?!your-|phc_|sk_test_|whsec_|price_|postgresql://postgres:\[)" | grep -v "^\+$\|^\+#"`

Expected: no output (all values are placeholders).

If the command surfaces a real-looking secret, abort the commit and rotate the key.

- [ ] **Step A.2.3: Commit**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: port build, CI, and Firebase config from prior session

Adds firebase.json (hosting + me-central1 functions, security headers),
.firebaserc (petapp-38f4a), .github/workflows/{ci,deploy}.yml (build, test,
deploy-on-push-to-main), functions/esbuild.mjs, updated package.json +
lockfiles across the monorepo, and .env.example template with all required
keys as placeholders. Content unchanged from working directory.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step A.2.4: Install dependencies matching the ported lockfiles**

Run: `npm ci`

Expected: completes with no errors. Sets node_modules to match the new lockfile.

---

### Task A.3: Port Firebase Auth migration + schema

**Files:** packages/db/src/schema.ts (Firebase UID + subscriptions + boosts), drizzle config, middleware/auth.ts, lib/firebase.ts, lib/auth-context.tsx

- [ ] **Step A.3.1: Stage Firebase Auth files**

Run:

```bash
git add packages/db/drizzle.config.ts packages/db/package.json \
  packages/db/src/index.ts packages/db/src/schema.ts \
  packages/server/src/middleware/auth.ts \
  packages/server/src/routes/auth.ts \
  packages/web/src/lib/firebase.ts \
  packages/web/src/lib/auth-context.tsx
```

- [ ] **Step A.3.2: Commit**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: port Firebase Auth migration + schema from prior session

Migrates user identity from JWT to Firebase Auth: users.id becomes
varchar(128) holding the Firebase UID, server middleware verifies ID tokens
via firebase-admin, /api/auth/sync upserts the user row on first login, web
auth-context uses the Firebase client SDK (email/password, Google, Apple).
Schema also adds dark-launched subscriptions + boosts tables for the
monetization scaffold (PR-2 extends). Content unchanged from working
directory.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task A.4: Port server routes + flows + helpers

**Files:** all route files, AI flows, genkit config, utilities, test helper

- [ ] **Step A.4.1: Stage server files**

Run:

```bash
git add packages/server/package.json \
  packages/server/src/api-server.ts \
  packages/server/src/genkit.ts \
  packages/server/src/mcp-server.ts \
  packages/server/src/routes/pets.ts \
  packages/server/src/routes/matches.ts \
  packages/server/src/routes/messages.ts \
  packages/server/src/routes/ai-tools.ts \
  packages/server/src/routes/contracts.ts \
  packages/server/src/routes/diagnostics.ts \
  packages/server/src/utils/validate-url.ts \
  packages/server/src/utils/parse-json.ts \
  packages/server/src/flows/breed-detect.ts \
  packages/server/src/flows/pet-diagnostic.ts \
  packages/server/src/flows/pet-match.ts \
  packages/server/src/flows/profile-review.ts \
  packages/server/src/flows/vet-advisor.ts \
  packages/server/src/flows/vet-document-ocr.ts \
  packages/server/tests/helpers/test-db.ts
```

- [ ] **Step A.4.2: Run existing tests against ported server code**

Run: `npx vitest run`

Expected: existing tests pass (13 test files). If any fail, STOP — the ported state is inconsistent and must be reconciled before continuing.

- [ ] **Step A.4.3: Commit**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: port server routes, AI flows, and helpers from prior session

Routes updated for Firebase UID resource ownership checks, parse-json helper
for JSON-text column deserialization (pet photoUrls, match warnings, etc.),
SSRF-protected URL validator, new pet-diagnostic and vet-document-ocr flows,
and mocked-Gemini test helpers. Content unchanged from working directory.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task A.5: Port web app shell + i18n + lib

**Files:** App.tsx, main.tsx, i18n, capacitor config, posthog, billing lib, index.html, tsconfig, vite config

- [ ] **Step A.5.1: Stage web shell files**

Run:

```bash
git add packages/web/package.json packages/web/capacitor.config.ts \
  packages/web/index.html packages/web/tsconfig.json packages/web/vite.config.ts \
  packages/web/src/App.tsx packages/web/src/main.tsx \
  packages/web/src/i18n/index.ts \
  packages/web/src/lib/capacitor.ts packages/web/src/lib/posthog.ts \
  packages/web/src/lib/billing.ts
```

- [ ] **Step A.5.2: Commit**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: port web app shell, i18n, and library code from prior session

Adds Suspense + React.lazy code splitting for heavy AI tool pages,
Arabic/English i18n with RTL direction switching, PostHog analytics init,
Capacitor platform helpers, Stripe checkout client wrapper (dark-launched),
and SEO meta/OG tags in index.html. Content unchanged from working directory.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task A.6: Port web pages + components

**Files:** Navbar, CookieBanner, Paywall, all page files

- [ ] **Step A.6.1: Stage web pages and components**

Run:

```bash
git add packages/web/src/components/Navbar.tsx \
  packages/web/src/components/CookieBanner.tsx \
  packages/web/src/components/Paywall.tsx \
  packages/web/src/pages/Landing.tsx \
  packages/web/src/pages/Login.tsx \
  packages/web/src/pages/Register.tsx \
  packages/web/src/pages/Privacy.tsx \
  packages/web/src/pages/Terms.tsx \
  packages/web/src/pages/ChatThread.tsx \
  packages/web/src/pages/Diagnostic.tsx \
  packages/web/src/pages/DocumentScan.tsx \
  packages/web/src/pages/MatchCreate.tsx \
  packages/web/src/pages/MatchDetail.tsx \
  packages/web/src/pages/PetCreate.tsx \
  packages/web/src/pages/PetDetail.tsx \
  packages/web/src/pages/PetEdit.tsx \
  packages/web/src/pages/Translate.tsx
```

- [ ] **Step A.6.2: Commit**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: port web pages + components from prior session

Adds Privacy/Terms pages (UAE PDPL compliance), CookieBanner (consent-gated
analytics init), social login buttons (Google + Apple) on Login/Register,
Register data-consent checkbox linking /terms + /privacy, Landing footer
with legal links, Diagnostic + DocumentScan AI tool pages, and the
dark-launched Paywall boost component. Content unchanged from working
directory.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task A.7: Port SEO + public assets

**Files:** robots.txt, sitemap.xml, og-image.png, apple-touch-icon.png, favicon-32.png

- [ ] **Step A.7.1: Stage public assets**

Run:

```bash
git add packages/web/public/robots.txt packages/web/public/sitemap.xml \
  packages/web/public/og-image.png packages/web/public/apple-touch-icon.png \
  packages/web/public/favicon-32.png
```

- [ ] **Step A.7.2: Commit**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: port SEO assets from prior session

Adds robots.txt (disallow /api, reference sitemap), sitemap.xml (Landing,
Login, Register, Terms, Privacy), Open Graph image, apple-touch-icon, and
favicon. Content unchanged from working directory.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task A.8: Port monetization scaffold (dark-launched)

**Files:** functions/src/index.ts, functions/src/billing/*

- [ ] **Step A.8.1: Stage billing scaffold**

Run:

```bash
git add functions/src/index.ts \
  functions/src/billing/createCheckoutSession.ts \
  functions/src/billing/stripeWebhook.ts
```

- [ ] **Step A.8.2: Commit**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: port dark-launched monetization scaffold from prior session

Adds functions/src/billing/createCheckoutSession (Callable, boost_24h
one-time payment) and stripeWebhook (signature-verified upsert of
subscriptions rows on checkout.session.completed). Both no-op when
MONETIZATION_ENABLED != 'true'. PR-2 will extend createCheckoutSession to
support subscription mode and the webhook to handle customer.subscription.*
events. Content unchanged from working directory.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step A.8.3: Verify clean state**

Run: `git status --short | grep -vE "\.codemap/|\.DS_Store|\.firebase/|petpawsphere-.*\.png|supabase-.*\.png|pets-list-.*\.png|dashboard-.*\.png|tsconfig\.tsbuildinfo"`

Expected: empty (only tooling/screenshot/build-artifact noise remains untracked).

If real source files appear, port them with an additional Task A.9 commit.

---

## Phase B: New gap-closure work

Phase B uses strict TDD: test first, run to confirm failure, implement, run to confirm pass, commit.

**Author attribution pattern** — every Phase B commit uses:

```
Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Task B.1: Server-side Sentry integration

**Files:**
- Create: `packages/server/src/lib/sentry.ts`
- Create: `packages/server/tests/lib/sentry.test.ts`
- Modify: `packages/server/package.json` (add @sentry/node)
- Modify: `packages/server/src/api-server.ts` (wire init + error handler)
- Modify: `.env.example` (add SENTRY_DSN placeholder)

- [ ] **Step B.1.1: Install @sentry/node**

Run: `cd packages/server && npm install @sentry/node@^8`

Expected: package.json gets `"@sentry/node": "^8.x.x"` entry; lockfile updated.

- [ ] **Step B.1.2: Write failing test for sentry init**

Create `packages/server/tests/lib/sentry.test.ts`:

```typescript
import { describe, expect, it, beforeEach, vi } from 'vitest';

describe('initSentry', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.SENTRY_DSN;
  });

  it('is a no-op when SENTRY_DSN is not set', async () => {
    const initSpy = vi.fn();
    vi.doMock('@sentry/node', () => ({ init: initSpy, setupExpressErrorHandler: vi.fn() }));
    const { initSentry } = await import('../../src/lib/sentry');
    initSentry();
    expect(initSpy).not.toHaveBeenCalled();
  });

  it('calls Sentry.init when SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1';
    const initSpy = vi.fn();
    vi.doMock('@sentry/node', () => ({ init: initSpy, setupExpressErrorHandler: vi.fn() }));
    const { initSentry } = await import('../../src/lib/sentry');
    initSentry();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy.mock.calls[0][0]).toMatchObject({ dsn: 'https://example@sentry.io/1' });
  });
});
```

- [ ] **Step B.1.3: Run test — confirm failure**

Run: `npx vitest run packages/server/tests/lib/sentry.test.ts`

Expected: FAIL with "Cannot find module '../../src/lib/sentry'".

- [ ] **Step B.1.4: Implement sentry.ts**

Create `packages/server/src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/node';

export function initSentry(): void {
  const dsn = process.env['SENTRY_DSN'];
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env['NODE_ENV'] || 'development',
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 0,
  });
}

export { Sentry };
```

- [ ] **Step B.1.5: Run test — confirm pass**

Run: `npx vitest run packages/server/tests/lib/sentry.test.ts`

Expected: 2 passed.

- [ ] **Step B.1.6: Wire Sentry into api-server.ts**

In `packages/server/src/api-server.ts`, add at the very top of the imports:

```typescript
import { initSentry, Sentry } from './lib/sentry';
```

Call `initSentry();` **as the first statement** inside `createApp()` (before `const db = ...`). After all route registrations but before `return app;`, add:

```typescript
  Sentry.setupExpressErrorHandler(app);
```

- [ ] **Step B.1.7: Run full server test suite**

Run: `npx vitest run packages/server`

Expected: all pass. No existing test should regress.

- [ ] **Step B.1.8: Add SENTRY_DSN to .env.example**

Append to `.env.example` under a new section:

```
# ─── Error monitoring ───────────────────────────────────────────────────────
# Server: set in Firebase Functions secret for production
#   firebase functions:secrets:set SENTRY_DSN
# Local: paste your DSN below (leave blank to disable Sentry)
SENTRY_DSN=
# Web (build-time env): same value prefixed for Vite
VITE_SENTRY_DSN=
```

- [ ] **Step B.1.9: Commit**

Run:

```bash
git add packages/server/package.json packages/server/package-lock.json \
  packages/server/src/lib/sentry.ts \
  packages/server/tests/lib/sentry.test.ts \
  packages/server/src/api-server.ts .env.example
git commit -m "$(cat <<'EOF'
feat(server): add DSN-gated Sentry error monitoring

initSentry() no-ops when SENTRY_DSN is unset so local dev is unaffected.
In production, captures unhandled errors via setupExpressErrorHandler.
Traces sampled at 10% in production, disabled elsewhere.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task B.2: Web-side Sentry integration

**Files:**
- Create: `packages/web/src/lib/sentry.ts`
- Create: `packages/web/tests/lib/sentry.test.ts`
- Modify: `packages/web/package.json` (add @sentry/react)
- Modify: `packages/web/src/main.tsx` (call initSentry before initPostHog)

- [ ] **Step B.2.1: Install @sentry/react**

Run: `cd packages/web && npm install @sentry/react@^8`

- [ ] **Step B.2.2: Write failing test**

Create `packages/web/tests/lib/sentry.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('initSentry (web)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SENTRY_DSN', '');
  });

  it('is a no-op when VITE_SENTRY_DSN is empty', async () => {
    const initSpy = vi.fn();
    vi.doMock('@sentry/react', () => ({ init: initSpy }));
    const { initSentry } = await import('../../src/lib/sentry');
    initSentry();
    expect(initSpy).not.toHaveBeenCalled();
  });

  it('calls Sentry.init with DSN when set', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example@sentry.io/1');
    const initSpy = vi.fn();
    vi.doMock('@sentry/react', () => ({ init: initSpy }));
    const { initSentry } = await import('../../src/lib/sentry');
    initSentry();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy.mock.calls[0][0]).toMatchObject({ dsn: 'https://example@sentry.io/1' });
  });
});
```

- [ ] **Step B.2.3: Run test — confirm failure**

Run: `cd packages/web && npx vitest run tests/lib/sentry.test.ts`

Expected: FAIL with module not found.

- [ ] **Step B.2.4: Implement web sentry.ts**

Create `packages/web/src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,
    replaysSessionSampleRate: 0,
  });
}
```

- [ ] **Step B.2.5: Run test — confirm pass**

Run: `cd packages/web && npx vitest run tests/lib/sentry.test.ts`

Expected: 2 passed.

- [ ] **Step B.2.6: Wire initSentry into main.tsx**

Edit `packages/web/src/main.tsx`. Add the import after the existing `initPostHog` import line:

```typescript
import { initSentry } from '@/lib/sentry';
```

Before the existing `initPostHog();` line, add:

```typescript
initSentry();
```

Final order: `initSentry()` then `initPostHog()`. Sentry first so PostHog failures would be captured by Sentry.

- [ ] **Step B.2.7: Commit**

Run:

```bash
git add packages/web/package.json packages/web/package-lock.json \
  packages/web/src/lib/sentry.ts packages/web/tests/lib/sentry.test.ts \
  packages/web/src/main.tsx
git commit -m "$(cat <<'EOF'
feat(web): add DSN-gated Sentry error monitoring

initSentry() no-ops when VITE_SENTRY_DSN is empty. In production captures
React errors with 10% trace sampling and 100% replay-on-error. Called
before initPostHog() so analytics init failures are captured.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task B.3: PATCH /api/auth/me profile update endpoint

**Files:**
- Create: `packages/server/tests/api/auth-profile-update.test.ts`
- Modify: `packages/server/src/routes/auth.ts` (add PATCH /me)

- [ ] **Step B.3.1: Write failing test**

Create `packages/server/tests/api/auth-profile-update.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api-server';
import { createTestDb, seedUser, cleanupTestDb, type TestDb } from '../helpers/test-db';

// Firebase token verification is mocked via middleware test double.
vi.mock('../../src/middleware/auth', async () => {
  const actual = await vi.importActual<typeof import('../../src/middleware/auth')>('../../src/middleware/auth');
  return {
    ...actual,
    requireAuth: (req: any, _res: any, next: any) => {
      req.userId = req.headers['x-test-uid'] || 'test-user-id';
      next();
    },
  };
});

describe('PATCH /api/auth/me', () => {
  let db: TestDb;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    db = await createTestDb();
    await seedUser(db, {
      id: 'test-user-id',
      email: 'u@example.com',
      name: 'Original Name',
      emirate: 'Dubai',
      role: 'owner',
    });
    app = createApp(db);
  });

  afterAll(async () => { await cleanupTestDb(db); });

  it('updates name, phone, and emirate', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('x-test-uid', 'test-user-id')
      .send({ name: 'New Name', phone: '+971500000000', emirate: 'Abu Dhabi' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'New Name',
      phone: '+971500000000',
      emirate: 'Abu Dhabi',
    });
  });

  it('rejects forbidden field: email', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('x-test-uid', 'test-user-id')
      .send({ email: 'hacker@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects forbidden field: role', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('x-test-uid', 'test-user-id')
      .send({ role: 'admin' });

    expect(res.status).toBe(400);
  });

  it('rejects forbidden field: kycVerified', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('x-test-uid', 'test-user-id')
      .send({ kycVerified: true });

    expect(res.status).toBe(400);
  });

  it('rejects forbidden field: id', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('x-test-uid', 'test-user-id')
      .send({ id: 'other-user-id' });

    expect(res.status).toBe(400);
  });

  it('accepts empty body as no-op', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('x-test-uid', 'test-user-id')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.name).toBeDefined();
  });
});
```

- [ ] **Step B.3.2: Run test — confirm failure**

Run: `npx vitest run packages/server/tests/api/auth-profile-update.test.ts`

Expected: FAIL — 404 on PATCH `/api/auth/me` since route doesn't exist.

- [ ] **Step B.3.3: Add PATCH /me to auth.ts**

In `packages/server/src/routes/auth.ts`, after the existing `GET /me` route handler, before `return router;`, add:

```typescript
  // PATCH /me — update name, phone, emirate. Rejects any other field.
  router.patch('/me', requireAuth, async (req: AuthRequest, res) => {
    const allowed = new Set(['name', 'phone', 'emirate']);
    const forbidden = Object.keys(req.body).filter(k => !allowed.has(k));
    if (forbidden.length > 0) {
      return res.status(400).json({
        error: `Forbidden fields: ${forbidden.join(', ')}`,
      });
    }

    const patch: Record<string, unknown> = {};
    if (typeof req.body.name === 'string') patch.name = req.body.name.trim().slice(0, 200);
    if (typeof req.body.phone === 'string') patch.phone = req.body.phone.trim().slice(0, 30);
    if (typeof req.body.emirate === 'string') patch.emirate = req.body.emirate.trim().slice(0, 50);
    patch.updatedAt = new Date().toISOString();

    await db.update(users).set(patch).where(eq(users.id, req.userId!));
    const [updated] = await db.select().from(users).where(eq(users.id, req.userId!));
    res.json(updated);
  });
```

Ensure `users` and `eq` are imported at the top of the file. If not, add:

```typescript
import { users } from '@petpawsphere/db';
import { eq } from 'drizzle-orm';
```

- [ ] **Step B.3.4: Run test — confirm pass**

Run: `npx vitest run packages/server/tests/api/auth-profile-update.test.ts`

Expected: 6 passed.

- [ ] **Step B.3.5: Run full server suite — check no regression**

Run: `npx vitest run packages/server`

Expected: all pass.

- [ ] **Step B.3.6: Commit**

Run:

```bash
git add packages/server/src/routes/auth.ts \
  packages/server/tests/api/auth-profile-update.test.ts
git commit -m "$(cat <<'EOF'
feat(server): add PATCH /api/auth/me profile update endpoint

Accepts partial updates to name, phone, emirate. Rejects any attempt to
set email, role, kycVerified, or id with 400. Trims + length-caps string
inputs at the route boundary. Closes the "Coming soon" placeholder in
Profile.tsx (PR-1 Task B.4 wires the client).

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task B.4: Wire Profile.tsx to PATCH /me

**Files:**
- Modify: `packages/web/src/pages/Profile.tsx`

- [ ] **Step B.4.1: Update Profile.tsx**

Replace `packages/web/src/pages/Profile.tsx` entirely with:

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';

const EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emirate, setEmirate] = useState(user?.emirate || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, emirate }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      await refreshUser?.();
      setMessage({ kind: 'ok', text: 'Profile updated' });
    } catch (err) {
      setMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Update failed',
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
          <User className="h-10 w-10 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            placeholder="+971 50 000 0000"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emirate</label>
          <select
            value={emirate}
            onChange={(e) => setEmirate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="">Select emirate</option>
            {EMIRATES.map((em) => (
              <option key={em} value={em}>{em}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:bg-amber-300 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {message && (
          <p
            className={`text-center text-sm ${
              message.kind === 'ok' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message.text}
          </p>
        )}
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <Link
          to="/profile/verification"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-sm transition-all"
        >
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">KYC Verification</p>
            <p className="text-sm text-gray-500">
              Verify your identity to unlock all features
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step B.4.2: Verify `auth` export + reconcile `refreshUser` call**

Run: `grep -n "^export \(const\|function\) auth\| auth\b" packages/web/src/lib/firebase.ts`

Expected: a line matching `export const auth = getAuth(...)` or similar. If the named export is different (e.g., `firebaseAuth`), update the `import { auth }` line in Profile.tsx to match.

Run: `grep -n "refreshUser\|reloadUser\|syncUser" packages/web/src/lib/auth-context.tsx`

Three possible outcomes:
- **Match found with name `refreshUser`:** Profile.tsx is correct as written. Skip to B.4.3.
- **Match found with different name (e.g., `reloadUser`):** Edit Profile.tsx line `await refreshUser?.();` to use the actual name AND update the `useAuth()` destructuring to match.
- **No match:** The context does not expose a refresh method. Remove the `await refreshUser?.()` line from Profile.tsx and drop `refreshUser` from the `useAuth()` destructuring. The local form state already shows the updated values — the Navbar-display name will refresh on next page load or after `auth.currentUser.reload()` at the top of `handleSave` — add this line if the Navbar regression is visible during B.4.3:

  ```typescript
  await auth.currentUser?.reload();
  ```

- [ ] **Step B.4.3: Run dev server and smoke-test manually**

Run two terminals:

Terminal 1: `cd packages/server && node --env-file=../../.env ../../node_modules/.bin/tsx watch src/api-server.ts`

Terminal 2: `cd packages/web && npm run dev`

Open `http://localhost:5173/profile` logged in. Change name, click Save. Expected: green "Profile updated" message. Refresh page; name persists.

If the flow fails, diagnose in Chrome DevTools Network tab — the PATCH call to `/api/auth/me` should return 200 with the updated user JSON.

- [ ] **Step B.4.4: Commit**

Run:

```bash
git add packages/web/src/pages/Profile.tsx
git commit -m "$(cat <<'EOF'
feat(web): wire Profile page to PATCH /api/auth/me

Replaces the "Coming soon — profile update API is not yet available"
placeholder with a real PATCH call that updates name, phone, emirate.
Disabled email field makes the read-only boundary explicit. Success/error
message auto-dismisses after 4s.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task B.5: Image lazy-loading on user-photo `<img>` tags

**Files:** any page that renders user-supplied `photoUrls[]` via `<img>`

- [ ] **Step B.5.1: Audit current img usage**

Run: `grep -rn '<img' packages/web/src --include="*.tsx"`

List every `<img>` tag. For each, determine:
- Does it render **user-generated** content (pet photos, match photos, user avatars from URL)? → needs `loading="lazy"`
- Is it a static asset in layout (logo, icon) above-the-fold? → leave eager (default)

- [ ] **Step B.5.2: For each user-photo img, add loading="lazy"**

Example — if `PetDetail.tsx` contains:

```tsx
<img src={photoUrl} alt={pet.name} className="..." />
```

Change to:

```tsx
<img src={photoUrl} alt={pet.name} loading="lazy" className="..." />
```

Apply across all user-photo `<img>` tags identified in Step B.5.1. If the audit returns no user-photo `<img>` tags (images may be rendered via CSS `background-image` or omitted in current pages), write a one-line note in the commit message and skip to B.5.4.

- [ ] **Step B.5.3: Verify no regressions**

Run: `cd packages/web && npm run build`

Expected: build succeeds.

Run: `cd packages/web && npx vitest run`

Expected: all tests pass.

- [ ] **Step B.5.4: Commit**

If changes were made:

```bash
git add packages/web/src/pages/*.tsx
git commit -m "$(cat <<'EOF'
perf(web): add loading="lazy" to user-photo img tags

Browser-native lazy loading defers offscreen image fetch until scroll.
Applied to user-generated content only; above-the-fold branding remains
eager.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

If no user-photo `<img>` tags found, commit a short note:

```bash
git commit --allow-empty -m "$(cat <<'EOF'
chore: audit user-photo img tags for lazy-loading (no action)

Grep revealed no user-generated <img> tags in current pages; pet photos
render via CSS background-image or are not yet wired. Revisit when
PetDetail/MatchDetail render photo galleries.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task C: Final verification + open PR

- [ ] **Step C.1: Full test suite**

Run: `npx vitest run`

Expected: all pass. Note count — should be ≥ 13 (original) + 3 (new: sentry server, sentry web, profile update) = **16 test files**.

- [ ] **Step C.2: Web build**

Run: `cd packages/web && npm run build`

Expected: build succeeds; dist/ is populated.

- [ ] **Step C.3: Functions build**

Run: `cd functions && npm run build`

Expected: build succeeds.

- [ ] **Step C.4: Smoke-check .env.example has no real secrets**

Run:

```bash
grep -E "^(SENTRY_DSN|STRIPE_SECRET_KEY|DATABASE_URL|VITE_FIREBASE_API_KEY|GOOGLE_GENAI_API_KEY)=" .env.example | grep -vE "=$|=your-|=phc_|=sk_test_|=postgresql://postgres:\["
```

Expected: no output (all are placeholders or empty).

- [ ] **Step C.5: Push branch**

Run: `git push -u origin feat/pr1-readiness-gaps`

Expected: new remote tracking branch.

- [ ] **Step C.6: Open PR**

Run:

```bash
gh pr create --title "PR-1: Launch readiness gap closure (Sentry, profile update, scaffold port)" --body "$(cat <<'EOF'
## Summary
- Ports the prior-session readiness scaffold (Firebase Auth migration, legal pages, cookie banner, social login, SEO, i18n) that was never committed since 05b3034
- Adds DSN-gated Sentry on server and web (no-op when DSN unset)
- Adds `PATCH /api/auth/me` profile update endpoint (rejects email/role/kycVerified/id)
- Wires Profile.tsx to the new endpoint, removing "Coming soon" placeholder
- Audits img tags for loading="lazy" on user-generated photos

All monetization scaffold remains dark-launched behind MONETIZATION_ENABLED=false. No flag flips.

## Test plan
- [x] `npx vitest run` — all 16 test files pass
- [x] `cd packages/web && npm run build` — succeeds
- [x] `cd functions && npm run build` — succeeds
- [x] Manual: Profile page save updates name; refresh persists
- [x] Manual: Sentry no-op verified when DSN unset (no network calls)
- [x] .env.example contains only placeholder values

## Out of scope (follow-up PRs)
- PR-2: Subscription paywall + quota enforcement + RevenueCat stubs (spec/2026-04-23)
- Spec 2: Firebase deploy, Stripe keys, flag flip
- Spec 3: Capacitor cap add, fastlane, TestFlight/Play Internal

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL returned. Paste URL in chat for human review.

---

## Success criteria for PR-1 done

- [ ] All Phase A port commits landed on `feat/pr1-readiness-gaps`
- [ ] Sentry no-op when DSN unset, initializes when DSN set (both server + web)
- [ ] `PATCH /api/auth/me` accepts name/phone/emirate, rejects email/role/kycVerified/id
- [ ] Profile.tsx saves + persists; no "Coming soon" text remains
- [ ] `loading="lazy"` applied to user-photo imgs (or audit-note commit if none exist yet)
- [ ] All tests pass; web + functions builds succeed
- [ ] PR opened; URL in chat

## Not in this plan (on purpose)

- Subscription paywall, quota middleware, `PaywallSubscription` component, RevenueCat → **PR-2** (separate plan)
- Firebase deploy, flag flip, Stripe test-key configuration → **Spec 2** (separate plan)
- Capacitor `cap add ios/android`, fastlane, TestFlight/Play Internal → **Spec 3** (separate plan)
- Pushing PR-1 to `main` without human review — STOP at `gh pr create`
