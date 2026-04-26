# PawMatch UAE 🐾

> **UAE's first AI-powered pet breeding platform** — match pets, detect breeds, get vet advice, and scan health documents, all powered by Google Gemini AI. Available in Arabic and English.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Hosting-orange)](https://firebase.google.com/)
[![Tests](https://img.shields.io/badge/Tests-66%20passing-green)](#testing)
[![Platform](https://img.shields.io/badge/Platform-Web%20%2B%20iOS%20%2B%20Android-lightgrey)](https://capacitorjs.com/)

---

## Overview

PawMatch UAE is a full-stack, production-grade AI pet platform built for the UAE market, compliant with **UAE Federal Decree-Law No. 45 of 2021 (PDPL)**. It combines:

- **AI Breed Detection** — identify pet breeds from photos via Google Gemini Vision
- **Compatibility Matching** — AI-powered genetic and temperament compatibility analysis
- **Vet Health Advisor** — AI vet consultations tailored to UAE climate and breeds
- **Pet Diagnostics** — symptom analysis from photos with urgency classification
- **Document OCR** — extract data from vet documents, prescriptions, and lab reports
- **Multilingual** — full Arabic + English UI with RTL support

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React 19 + Vite  (Web)  │  Capacitor  (iOS / Android)  │
├─────────────────────────────────────────────────────────┤
│              Firebase Auth (Google · Apple · Email)     │
├─────────────────────────────────────────────────────────┤
│         Express.js API  (Firebase Functions v2)         │
│         Drizzle ORM  →  Supabase PostgreSQL             │
├─────────────────────────────────────────────────────────┤
│         Google Gemini 2.5 Flash  (via Genkit)           │
│         Firebase AI Logic (Phase 4 roadmap)             │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Shadcn/UI |
| Mobile | Capacitor (iOS + Android) |
| Auth | Firebase Authentication |
| Backend | Express.js, TypeScript |
| ORM | Drizzle ORM (postgres-js) |
| Database | Supabase PostgreSQL |
| AI | Google Gemini 2.5 Flash via Genkit |
| Hosting | Firebase Hosting + Functions v2 |
| i18n | i18next (Arabic + English, RTL) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- Supabase project ([supabase.com](https://supabase.com))
- Google AI API key ([aistudio.google.com](https://aistudio.google.com/app/apikey))

### Installation

```bash
git clone https://github.com/Taas-ai/pawmatch-uae.git
cd pawmatch-uae
npm install
cp .env.example .env
# Fill in your Firebase, Supabase, and Google AI credentials
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# Firebase (web client)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# AI
GOOGLE_GENAI_API_KEY=your-google-ai-api-key

# Server
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,capacitor://localhost
```

See [`.env.example`](.env.example) for the complete reference.

### Run Locally

```bash
# Start API server
npm run dev --workspace=packages/server

# Start web app
npm run dev --workspace=packages/web

# Run all tests
npx vitest run
```

---

## API Reference

All endpoints require `Authorization: Bearer <firebase-id-token>` except where noted.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sync` | Upsert user after Firebase sign-in |
| GET | `/api/auth/me` | Get current user profile |

### Pets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pets` | Browse pets (filter: species, breed, emirate, gender) |
| POST | `/api/pets` | Create a pet profile |
| GET | `/api/pets/:id` | Get pet details |
| PUT | `/api/pets/:id` | Update pet profile |
| DELETE | `/api/pets/:id` | Deactivate pet |

### Matching
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/matches/analyze` | Run AI compatibility analysis |
| GET | `/api/matches` | List user's matches |
| PUT | `/api/matches/:id/respond` | Accept or reject a match |

### AI Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/breed-detect` | Detect breed from photo |
| POST | `/api/vet-advisor/:petId` | AI vet consultation |
| POST | `/api/profile-review/:petId` | AI profile quality review |
| POST | `/api/translate` | Arabic ↔ English translation |
| POST | `/api/diagnostics/diagnostic/:petId` | Symptom photo analysis |
| POST | `/api/diagnostics/documents/:petId/scan` | Vet document OCR |

### Public Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources/breeds` | UAE breed catalog |
| GET | `/api/resources/vets` | UAE vet directory |

---

## Testing

```bash
npx vitest run        # Run all tests once
npx vitest            # Watch mode
npx vitest --coverage # Coverage report
```

**Test coverage**: 66 unit/integration tests across API routes, AI flows, and schema validation. Smoke tests (E2E) are intentionally skipped until Firebase + Supabase staging environments are provisioned.

---

## Deployment

### Firebase Hosting + Functions

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login
firebase use your-project-id

# Build web app
npm run build --workspace=packages/web

# Deploy everything
firebase deploy
```

### Capacitor Mobile

```bash
cd packages/web
npm run build
npx cap sync
npx cap open ios      # Open in Xcode
npx cap open android  # Open in Android Studio
```

---

## Licensing

### Open Source (Apache 2.0)

This project is open-sourced under the [Apache License 2.0](LICENSE).

You are free to:
- **Use** commercially, including in SaaS products
- **Modify** and build derivative works
- **Distribute** copies of the software
- **Patent protection** — contributors grant you an express patent license

You must:
- **Retain** copyright, license, and attribution notices
- **State changes** made to the files

### Commercial / Enterprise License

For businesses that require:

- **White-label deployment** under your own brand
- **Priority support SLA** (response within 4 hours)
- **Custom AI model** integration
- **Multi-emirate SaaS deployment** with dedicated infrastructure
- **Veterinary clinic management** features
- **Regulatory compliance consulting** (UAE PDPL, MOHAP)

Contact: **admin@taurusai.io** | [TAURUS AI Corp](https://taurusai.io)

---

## Security

Found a vulnerability? Please do **not** open a public issue. Email **privacy@pawmatch.ae** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment

We follow responsible disclosure and will respond within 48 hours.

See [`SECURITY.md`](SECURITY.md) for the full policy.

---

## Contributing

We welcome contributions! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting pull requests.

### Development Philosophy

- TypeScript strict mode everywhere
- Tests required for new API endpoints
- OWASP Top 10 compliance is non-negotiable
- UAE PDPL data minimization principles apply to all new data collection

---

## Roadmap

- [ ] **v1.0** — Firebase Hosting + Functions deployment (current)
- [ ] **v1.1** — Stripe payments for premium matching credits
- [ ] **v1.2** — Real-time chat via Firebase Realtime DB
- [ ] **v2.0** — Firestore migration for offline-first mobile
- [ ] **v2.1** — Vet clinic portal with appointment booking
- [ ] **v2.2** — Pedigree certificate NFT (blockchain anchoring)

---

## Legal

- [Privacy Policy](packages/web/src/pages/Privacy.tsx) — UAE PDPL compliant
- [Terms of Service](packages/web/src/pages/Terms.tsx)
- Copyright © 2026 TAURUS AI Corp, Dubai, United Arab Emirates

---

## Flip monetization on in 10 minutes (Stripe test mode)

PawMatch ships with a dark-launched Stripe "Boost for 24h" paywall. While `MONETIZATION_ENABLED=false` (the default) both the web button and the Cloud Functions no-op. To enable:

1. Create a Stripe account and switch to **test mode** (dashboard top-right toggle).
2. Create one product + price — e.g. `Profile Boost 24h`, `USD 2.99` one-time.
3. Copy `sk_test_...`, `pk_test_...`, and the new `price_...` ID.
4. In `.env` at repo root:
   ```
   MONETIZATION_ENABLED=true
   VITE_MONETIZATION_ENABLED=true
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_STRIPE_PRICE_BOOST_24H=price_...
   WEB_ORIGIN=http://localhost:5173
   ```
5. Apply the Drizzle migration (adds `subscriptions` + `boosts` tables):
   ```
   npm run db:generate
   npm run db:migrate
   ```
6. Add the webhook endpoint in Stripe dashboard → `https://<host>/stripeWebhook` (Cloud Functions URL after deploy). Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
7. Deploy functions: `cd functions && npm i && npm run build && firebase deploy --only functions`.
8. For live mode later, set secrets via `firebase functions:secrets:set STRIPE_SECRET_KEY` etc. — do **not** ship live keys in `.env`.

Test locally: open `/pets/<your-pet-id>`, click **Boost for 24h**, complete with card `4242 4242 4242 4242`. The webhook writes a row into `boosts` keyed on the Stripe session ID (idempotent on retries).

---

<div align="center">
  Built with ❤️ in Dubai by <a href="https://taurusai.io">TAURUS AI Corp</a>
</div>
