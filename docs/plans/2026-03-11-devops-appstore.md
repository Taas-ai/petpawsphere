# PetPawSphere — DevOps & App Store Deployment Plan
**Created**: 2026-03-10
**Resume**: Start next session with "Continue the DevOps + App Store deployment plan"

---

## Current State
- [x] All features built and E2E tested
- [x] Firebase Auth migration complete
- [x] Supabase PostgreSQL connected
- [x] Security hardened (OWASP audit applied)
- [x] PostHog analytics instrumented
- [x] CLAUDE.md and MEMORY.md updated
- [ ] **Nothing deployed — backend is still local only**

---

## Phase 1: Firebase Functions + Hosting Deploy
**Goal**: Get backend live at `petpawsphere.web.app`
**Blocker**: Needs interactive terminal (Firebase login)

### Step 1.1 — Verify firebase.json is correct
```bash
cat firebase.json   # should have hosting + functions config
cat .firebaserc     # should have project ID set
```

### Step 1.2 — Set Functions environment variables
Firebase Functions needs these secrets (set via Firebase CLI, not .env):
```bash
firebase functions:secrets:set DATABASE_URL
firebase functions:secrets:set GOOGLE_GENAI_API_KEY
# FIREBASE_PROJECT_ID is auto-provided in Functions environment
# ALLOWED_ORIGINS should be set to https://petpawsphere.web.app
```

### Step 1.3 — Build and deploy
```bash
# Build web app
cd packages/web && npm run build

# Deploy everything
firebase deploy --only hosting,functions
```

### Step 1.4 — Verify
- [ ] Open `https://petpawsphere.web.app` — landing page loads
- [ ] Register new user — Firebase Auth works
- [ ] Create a pet — Supabase DB write works
- [ ] Run breed detect — Gemini AI works

---

## Phase 2: Capacitor Production Config
**Goal**: Point the mobile app at the live backend

### Step 2.1 — Update capacitor.config.ts
```typescript
// packages/web/capacitor.config.ts
// Add server.url for production builds only
// (handled in lib/capacitor.ts — verify getApiBaseUrl() returns '' in prod = same-origin)
```

### Step 2.2 — Verify `packages/web/src/lib/capacitor.ts`
Make sure production URL returns `''` (same-origin via Hosting rewrite) or `https://petpawsphere.web.app`

### Step 2.3 — Add domain to Firebase Auth
Firebase Console → Authentication → Settings → Authorized Domains:
- Add: `petpawsphere.web.app`
- Add: `petpawsphere.com` (when custom domain is ready)

---

## Phase 3: App Assets
**Goal**: Icons, splash screens, screenshots for both stores

### Step 3.1 — Generate icons and splash
```bash
# Place source files:
# packages/web/resources/icon.png       (1024×1024, no rounded corners)
# packages/web/resources/splash.png     (2732×2732)

npx @capacitor/assets generate --ios --android
```

### Step 3.2 — Screenshots needed
| Store | Sizes Required |
|-------|---------------|
| Google Play | Phone 16:9 min 320px, Tablet optional |
| Apple App Store | iPhone 6.7" (1290×2796), 6.5" (1242×2688), iPad 12.9" (2048×2732) |

Take screenshots of: Landing, Dashboard, Browse Pets, Match Detail, Chat, AI Tools

---

## Phase 4: Android → Google Play
**Goal**: Upload AAB to Play Console

### Checklist
- [ ] Google Play Console account created ($25 one-time)
- [ ] Keystore generated and backed up securely:
  ```bash
  keytool -genkey -v -keystore petpawsphere-release.keystore \
    -alias petpawsphere -keyalg RSA -keysize 2048 -validity 10000
  # Store in: ~/secure/petpawsphere-release.keystore (NOT in git)
  ```
- [ ] Build signed AAB in Android Studio
  - `npx cap sync android && npx cap open android`
  - Build → Generate Signed Bundle → Android App Bundle
- [ ] Play Console store listing:
  - [ ] App title: "PetPawSphere - Pet Breeding"
  - [ ] Short description (80 chars max)
  - [ ] Full description (4000 chars max)
  - [ ] Screenshots uploaded (min 2 phone screenshots)
  - [ ] Feature graphic (1024×500)
  - [ ] Content rating questionnaire completed
  - [ ] Data safety section completed (email, location, pet data collected)
  - [ ] Target regions: UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, Oman
- [ ] Submit for review (Internal → Closed → Production track)

---

## Phase 5: iOS → Apple App Store
**Goal**: Submit IPA to App Store Connect

### Checklist
- [ ] Apple Developer account enrolled ($99/year)
- [ ] Xcode project configured:
  - Bundle ID: `ae.petpawsphere.app`
  - Team set to Apple Developer account
  - **Sign In with Apple capability** enabled (required since Google login offered)
  - Version: 1.0.0, Build: 1
- [ ] `npx cap sync ios && npx cap open ios`
- [ ] Archive → Distribute → App Store Connect
- [ ] App Store Connect listing:
  - [ ] App name, subtitle
  - [ ] Keywords (pet breeding, pets UAE, dog breeding, cat breeding)
  - [ ] Description (Arabic + English)
  - [ ] Screenshots uploaded for all required sizes
  - [ ] Age rating: 4+
  - [ ] Privacy policy URL: `https://petpawsphere.web.app/privacy`
  - [ ] Data collection declarations
- [ ] Submit for review

---

## Phase 6: Custom Domain (Optional but Recommended)
**Goal**: `app.petpawsphere.com` instead of `petpawsphere.web.app`

```bash
# In Firebase Console → Hosting → Add custom domain
# Add DNS records to your domain registrar:
#   A record: 151.101.1.195  (Firebase)
#   A record: 151.101.65.195 (Firebase)
```

---

## Phase 7: CI/CD Pipeline
**Goal**: Auto-deploy on push to main

File: `.github/workflows/deploy.yml`
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: cd packages/web && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
```

---

## Environment Variables Needed for Production

| Variable | Where | Value |
|----------|-------|-------|
| `DATABASE_URL` | Firebase Functions secret | Supabase connection string |
| `GOOGLE_GENAI_API_KEY` | Firebase Functions secret | From Google AI Studio |
| `VITE_FIREBASE_API_KEY` | Web build env | From Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | Web build env | `petpawsphere.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Web build env | `petpawsphere` |
| `VITE_FIREBASE_APP_ID` | Web build env | From Firebase Console |
| `VITE_POSTHOG_KEY` | Web build env | From PostHog project settings |
| `VITE_RECAPTCHA_SITE_KEY` | Web build env | From reCAPTCHA v3 console (optional) |
| `ALLOWED_ORIGINS` | Firebase Functions config | `https://petpawsphere.web.app` |

---

## Estimated Timeline
| Phase | Time |
|-------|------|
| Phase 1: Deploy backend | 2–3 hours |
| Phase 2: Capacitor config | 30 min |
| Phase 3: App assets | 3–5 hours |
| Phase 4: Android submission | 4–6 hours |
| Phase 5: iOS submission | 4–6 hours |
| Google Play review | 3–7 days |
| Apple review | 1–3 days |

**Total to both stores live: ~2 weeks** (review time dominates)

---

## Immediate First Step Tomorrow
```bash
# 1. Open a terminal (Firebase needs interactive login)
firebase login

# 2. Check firebase.json and .firebaserc are correct
cat firebase.json && cat .firebaserc

# 3. Set the DATABASE_URL secret
firebase functions:secrets:set DATABASE_URL

# 4. Deploy
firebase deploy
```
