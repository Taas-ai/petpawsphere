# PetPawSphere Full Platform Design

**Date:** 2026-03-07
**Author:** TAURUS AI Corp
**Status:** Approved

---

## Overview

Transform the existing Genkit MCP server (5 AI flows) into a full-stack pet breeding platform with React frontend, SQLite persistence, authentication, chat, and breeding contracts.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | React + Vite | Lightweight, pairs with existing TS backend |
| Database | SQLite + Drizzle | Zero infra, file-based, migrate to Postgres later |
| Architecture | Monorepo (packages/) | Clean separation, shared types between server/web/db |
| Testing | Vitest + Genkit Dev UI | Automated CI + interactive dev testing |
| UI | Tailwind CSS + shadcn/ui | Fast, professional, TAURUS-consistent |
| Auth | JWT + bcrypt | Simple, stateless |
| i18n | react-i18next + RTL | Arabic/English bilingual for UAE market |
| State | TanStack Query | Server state caching, auto-refetch |
| Routing | React Router v7 | Standard, lightweight |
| Forms | React Hook Form + Zod | Reuse Zod schemas from server |

---

## Monorepo Structure

```
JACOB_PET_APP/
├── packages/
│   ├── db/                  # Drizzle schema, migrations, seed
│   │   ├── src/
│   │   │   ├── schema.ts
│   │   │   ├── index.ts
│   │   │   └── seed.ts
│   │   ├── migrations/
│   │   └── drizzle.config.ts
│   ├── server/              # Genkit MCP + Express API
│   │   ├── src/
│   │   │   ├── flows/       # Existing 5 AI flows (moved)
│   │   │   ├── routes/      # REST endpoints
│   │   │   ├── middleware/   # Auth, validation
│   │   │   ├── genkit.ts
│   │   │   ├── mcp-server.ts
│   │   │   └── api-server.ts
│   │   └── tests/
│   └── web/                 # React + Vite frontend
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── i18n/
│       │   └── App.tsx
│       └── tests/
├── fixtures/                # Shared test data
├── package.json             # Workspace root
└── tsconfig.json
```

---

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| email | TEXT | unique |
| passwordHash | TEXT | bcrypt |
| name | TEXT | |
| phone | TEXT | |
| emirate | TEXT | Dubai/Abu Dhabi/Sharjah/etc |
| role | TEXT | owner, breeder, vet, admin |
| kycVerified | BOOLEAN | default false |
| avatarUrl | TEXT | nullable |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

### pets
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| ownerId | UUID | FK -> users |
| name | TEXT | |
| species | TEXT | dog, cat |
| breed | TEXT | |
| age | REAL | years |
| gender | TEXT | male, female |
| weight | REAL | kg |
| location | TEXT | emirate/city |
| temperament | TEXT | nullable |
| pedigree | TEXT | nullable |
| healthRecords | TEXT | JSON array |
| dnaTestResults | TEXT | nullable |
| isNeutered | BOOLEAN | |
| photoUrls | TEXT | JSON array |
| status | TEXT | active, inactive, suspended |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

### matches
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| petAId | UUID | FK -> pets |
| petBId | UUID | FK -> pets |
| requestedBy | UUID | FK -> users |
| status | TEXT | pending, accepted, rejected, completed |
| compatibilityScore | REAL | 0-100 |
| geneticHealthRisk | TEXT | low, medium, high |
| breedCompatibility | TEXT | excellent, good, fair, poor |
| temperamentMatch | TEXT | excellent, good, fair, poor |
| locationProximity | TEXT | |
| recommendation | TEXT | |
| warnings | TEXT | JSON array |
| breedingTips | TEXT | JSON array |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| matchId | UUID | FK -> matches |
| senderId | UUID | FK -> users |
| content | TEXT | |
| createdAt | TIMESTAMP | |

### breeding_contracts
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| matchId | UUID | FK -> matches |
| ownerAId | UUID | FK -> users |
| ownerBId | UUID | FK -> users |
| studFeeAED | REAL | nullable |
| terms | TEXT | nullable |
| status | TEXT | draft, active, completed, disputed |
| contractText | TEXT | AI-generated |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

### vet_consultations
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| petId | UUID | FK -> pets |
| requestedBy | UUID | FK -> users |
| breedingReadiness | TEXT | ready, not yet, consult vet first, not recommended |
| requiredTests | TEXT | JSON array of objects |
| breedSpecificRisks | TEXT | JSON array |
| uaeClimateConsiderations | TEXT | JSON array |
| generalAdvice | TEXT | |
| createdAt | TIMESTAMP | |

---

## API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Pets
```
GET    /api/pets              # List (filterable: species, breed, emirate, gender)
POST   /api/pets              # Create
GET    /api/pets/:id          # Detail
PUT    /api/pets/:id          # Update (owner only)
DELETE /api/pets/:id          # Soft delete (owner only)
```

### Matches
```
POST /api/matches/analyze     # Call petMatch flow + save
GET  /api/matches             # List user's matches
PUT  /api/matches/:id/respond # Accept/reject
GET  /api/matches/:id         # Detail with AI results
```

### Messages
```
GET  /api/messages/:matchId   # Get chat (match participants only)
POST /api/messages/:matchId   # Send message
```

### AI Tools
```
POST /api/breed-detect           # breedDetect flow
POST /api/translate              # translate flow
POST /api/profile-review/:petId  # profileReview flow + save
POST /api/vet-advisor/:petId     # vetAdvisor flow + save
```

### Contracts
```
POST /api/contracts              # Generate (AI)
PUT  /api/contracts/:id          # Update status
GET  /api/contracts/:id          # View
```

### Resources
```
GET /api/resources/breeds        # UAE popular breeds
GET /api/resources/vets          # UAE vet directory
```

---

## Frontend Pages

| Route | Page | Auth Required |
|-------|------|---------------|
| / | Landing (hero, features, CTA) | No |
| /login | Login form | No |
| /register | Registration + emirate | No |
| /dashboard | Overview: pets, matches, activity | Yes |
| /pets | Browse all pets (grid + filters) | Yes |
| /pets/new | Add pet (multi-step form) | Yes |
| /pets/:id | Pet profile (gallery, stats, match btn) | Yes |
| /pets/:id/edit | Edit pet | Yes (owner) |
| /matches | My matches (tabs: pending/accepted/completed) | Yes |
| /matches/:id | Match detail + chat + contract | Yes |
| /tools/breed-detect | Photo upload -> breed detection | Yes |
| /tools/translate | Arabic <-> English translator | Yes |
| /tools/vet-advisor | Vet consultation form -> AI advice | Yes |
| /messages | All conversations | Yes |
| /messages/:matchId | Chat thread | Yes |
| /profile | User settings | Yes |
| /profile/verification | KYC / breeder verification | Yes |

### Key Components
- **CompatibilityCard** - circular score gauge + risk badges + recommendation
- **PetCard** - photo, breed, location, quick-match button
- **BreedDetectResult** - image preview + detected breed + UAE stats
- **VetAdvisorReport** - readiness badge + required tests table (AED costs)
- **ChatThread** - message bubbles, auto-scroll, match context header
- **ContractViewer** - AI-generated contract with accept/edit/dispute

---

## Testing Strategy

### Flow Tests (Vitest, mocked Gemini)
- pet-match.test.ts - output matches MatchResultSchema
- breed-detect.test.ts - image URL + text paths
- translate.test.ts - AR->EN, EN->AR with context variants
- profile-review.test.ts - fraud flags + quality scoring
- vet-advisor.test.ts - readiness + cost output

### API Tests (Vitest + Supertest, in-memory SQLite)
- auth.test.ts - register, login, JWT, protected routes
- pets.test.ts - CRUD, ownership checks
- matches.test.ts - create, accept/reject, status transitions
- messages.test.ts - send/receive, match-gated access

### DB Tests (Vitest + Drizzle)
- migrations.test.ts - schema creates cleanly
- schema.test.ts - constraints enforced, seed works

### Component Tests (Vitest + React Testing Library)
- PetCard, CompatibilityCard, BreedDetectResult

### Manual Testing
- Genkit Dev UI (`npx genkit start`) for interactive flow testing

### Test Fixtures
Shared fixtures/ with sample pets, users, match results, and mock Gemini responses for deterministic CI.

---

## Bilingual Support
- react-i18next for AR/EN toggle
- RTL layout via Tailwind `rtl:` variant
- Translation flow integrated in-app

## Data Flow
```
User -> React UI -> TanStack Query -> Express API -> Genkit Flow -> Gemini AI
                                           |
                                      Drizzle -> SQLite
                                      (persist results)
```
