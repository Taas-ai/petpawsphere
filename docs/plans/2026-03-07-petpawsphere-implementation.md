# PetPawSphere Full Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform existing Genkit MCP server into a full-stack monorepo with React frontend, SQLite persistence, Express API, auth, chat, contracts, and test suite.

**Architecture:** npm workspaces monorepo with 3 packages (db, server, web). Existing flows move into packages/server/src/flows/. Drizzle+SQLite for persistence. Express wraps flows as REST API. React+Vite frontend with shadcn/ui.

**Tech Stack:** TypeScript, Genkit 1.29, Gemini 2.5 Flash, Drizzle ORM, SQLite, Express, React 19, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router v7, Vitest, JWT, bcrypt, react-i18next

---

## Phase 1: Monorepo Scaffold + Database

### Task 1: Convert to npm workspaces monorepo

**Files:**
- Modify: `package.json` (root)
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Move: `src/*` -> `packages/server/src/`
- Modify: `tsconfig.json` (root, add references)

**Step 1: Create root workspace package.json**

Replace root `package.json` with:

```json
{
  "name": "petpawsphere",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "npm run dev --workspace=packages/server & npm run dev --workspace=packages/web",
    "build": "npm run build --workspaces",
    "test": "vitest run",
    "db:generate": "npm run generate --workspace=packages/db",
    "db:migrate": "npm run migrate --workspace=packages/db",
    "db:seed": "npm run seed --workspace=packages/db"
  },
  "devDependencies": {
    "vitest": "^3.1.0",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Create packages/db/package.json**

```json
{
  "name": "@petpawsphere/db",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "seed": "tsx src/seed.ts"
  },
  "dependencies": {
    "drizzle-orm": "^0.39.0",
    "better-sqlite3": "^11.8.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "drizzle-kit": "^0.31.0",
    "tsx": "^4.21.0"
  }
}
```

**Step 3: Create packages/db/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

**Step 4: Move existing server code**

```bash
mkdir -p packages/server/src/flows
mv src/genkit.ts packages/server/src/
mv src/mcp-server.ts packages/server/src/
mv src/flows/* packages/server/src/flows/
rmdir src/flows
rmdir src
```

**Step 5: Create packages/server/package.json**

```json
{
  "name": "@petpawsphere/server",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "main": "dist/api-server.js",
  "scripts": {
    "dev": "tsx watch src/api-server.ts",
    "build": "tsc",
    "mcp": "tsx src/mcp-server.ts",
    "genkit:dev": "npx genkit start -- tsx src/mcp-server.ts"
  },
  "dependencies": {
    "@petpawsphere/db": "*",
    "@genkit-ai/express": "^1.29.0",
    "@genkit-ai/google-genai": "^1.29.0",
    "@genkit-ai/mcp": "^1.29.0",
    "@modelcontextprotocol/sdk": "^1.27.1",
    "genkit": "^1.29.0",
    "zod": "^4.3.6",
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/node": "^25.3.5",
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/uuid": "^10.0.0",
    "genkit-cli": "^1.29.0",
    "tsx": "^4.21.0",
    "supertest": "^7.1.0",
    "@types/supertest": "^6.0.2"
  }
}
```

**Step 6: Create packages/server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

**Step 7: Update root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "references": [
    { "path": "packages/db" },
    { "path": "packages/server" }
  ]
}
```

**Step 8: Install dependencies and verify**

```bash
rm -rf node_modules package-lock.json
npm install
cd packages/server && npx tsc --noEmit
```

Expected: No TypeScript errors (existing flows compile clean)

**Step 9: Commit**

```bash
git add -A
git commit -m "refactor: convert to npm workspaces monorepo"
```

---

### Task 2: Database schema with Drizzle

**Files:**
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/drizzle.config.ts`

**Step 1: Write schema**

Create `packages/db/src/schema.ts`:

```typescript
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  emirate: text('emirate'),
  role: text('role', { enum: ['owner', 'breeder', 'vet', 'admin'] }).notNull().default('owner'),
  kycVerified: integer('kyc_verified', { mode: 'boolean' }).notNull().default(false),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const pets = sqliteTable('pets', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  species: text('species', { enum: ['dog', 'cat'] }).notNull(),
  breed: text('breed').notNull(),
  age: real('age').notNull(),
  gender: text('gender', { enum: ['male', 'female'] }).notNull(),
  weight: real('weight').notNull(),
  location: text('location').notNull(),
  temperament: text('temperament'),
  pedigree: text('pedigree'),
  healthRecords: text('health_records').notNull().default('[]'),
  dnaTestResults: text('dna_test_results'),
  isNeutered: integer('is_neutered', { mode: 'boolean' }).notNull().default(false),
  photoUrls: text('photo_urls').notNull().default('[]'),
  status: text('status', { enum: ['active', 'inactive', 'suspended'] }).notNull().default('active'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  petAId: text('pet_a_id').notNull().references(() => pets.id),
  petBId: text('pet_b_id').notNull().references(() => pets.id),
  requestedBy: text('requested_by').notNull().references(() => users.id),
  status: text('status', { enum: ['pending', 'accepted', 'rejected', 'completed'] }).notNull().default('pending'),
  compatibilityScore: real('compatibility_score'),
  geneticHealthRisk: text('genetic_health_risk'),
  breedCompatibility: text('breed_compatibility'),
  temperamentMatch: text('temperament_match'),
  locationProximity: text('location_proximity'),
  recommendation: text('recommendation'),
  warnings: text('warnings').notNull().default('[]'),
  breedingTips: text('breeding_tips').notNull().default('[]'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id),
  senderId: text('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const breedingContracts = sqliteTable('breeding_contracts', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id),
  ownerAId: text('owner_a_id').notNull().references(() => users.id),
  ownerBId: text('owner_b_id').notNull().references(() => users.id),
  studFeeAED: real('stud_fee_aed'),
  terms: text('terms'),
  status: text('status', { enum: ['draft', 'active', 'completed', 'disputed'] }).notNull().default('draft'),
  contractText: text('contract_text'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const vetConsultations = sqliteTable('vet_consultations', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id),
  requestedBy: text('requested_by').notNull().references(() => users.id),
  breedingReadiness: text('breeding_readiness'),
  requiredTests: text('required_tests').notNull().default('[]'),
  breedSpecificRisks: text('breed_specific_risks').notNull().default('[]'),
  uaeClimateConsiderations: text('uae_climate_considerations').notNull().default('[]'),
  generalAdvice: text('general_advice'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
```

**Step 2: Write db index with connection factory**

Create `packages/db/src/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

export * from './schema';
export { schema };

export function createDb(dbPath: string = './petpawsphere.db') {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type PetPawSphereDb = ReturnType<typeof createDb>;
```

**Step 3: Write drizzle config**

Create `packages/db/drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './petpawsphere.db',
  },
});
```

**Step 4: Generate migration and verify**

```bash
cd packages/db
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: Migration files created in `packages/db/migrations/`, SQLite file created.

**Step 5: Commit**

```bash
git add packages/db
git commit -m "feat: add Drizzle schema with 6 tables for SQLite"
```

---

### Task 3: Seed data + DB test

**Files:**
- Create: `packages/db/src/seed.ts`
- Create: `fixtures/sample-data.ts`
- Create: `packages/db/tests/schema.test.ts`

**Step 1: Create shared test fixtures**

Create `fixtures/sample-data.ts`:

```typescript
export const sampleUsers = [
  {
    id: 'user-sarah-001',
    email: 'sarah@example.com',
    passwordHash: '$2a$10$placeholder',
    name: 'Sarah Thompson',
    phone: '+971501234567',
    emirate: 'Dubai',
    role: 'owner' as const,
    kycVerified: true,
  },
  {
    id: 'user-ahmed-002',
    email: 'ahmed@example.com',
    passwordHash: '$2a$10$placeholder',
    name: 'Ahmed Al Mansouri',
    phone: '+971551234567',
    emirate: 'Abu Dhabi',
    role: 'breeder' as const,
    kycVerified: true,
  },
];

export const samplePets = [
  {
    id: 'pet-golden-001',
    ownerId: 'user-sarah-001',
    name: 'Luna',
    species: 'dog' as const,
    breed: 'Golden Retriever',
    age: 3,
    gender: 'female' as const,
    weight: 28,
    location: 'Dubai',
    temperament: 'Friendly, gentle, great with children',
    isNeutered: false,
    healthRecords: JSON.stringify(['Vaccinated', 'Hip dysplasia clear']),
    photoUrls: JSON.stringify([]),
    status: 'active' as const,
  },
  {
    id: 'pet-saluki-002',
    ownerId: 'user-ahmed-002',
    name: 'Riyah',
    species: 'dog' as const,
    breed: 'Saluki',
    age: 4,
    gender: 'male' as const,
    weight: 25,
    location: 'Abu Dhabi',
    temperament: 'Independent, loyal, elegant',
    pedigree: 'Champion bloodline - 3 generations',
    isNeutered: false,
    healthRecords: JSON.stringify(['DNA tested', 'Heart clear', 'Eyes clear']),
    dnaTestResults: 'Pure Saluki - no genetic markers for breed-specific conditions',
    photoUrls: JSON.stringify([]),
    status: 'active' as const,
  },
];

export const mockGeminiMatchResponse = {
  compatibilityScore: 72,
  geneticHealthRisk: 'low' as const,
  breedCompatibility: 'fair' as const,
  temperamentMatch: 'good' as const,
  locationProximity: 'Dubai to Abu Dhabi - 130km, manageable',
  recommendation: 'These pets are different breeds so this would be a crossbreed. Both have excellent health records.',
  warnings: ['Different breeds - offspring will be mixed breed', 'Confirm both owners want crossbreed puppies'],
  breedingTips: ['Schedule vet pre-breeding check', 'Arrange neutral meeting location'],
};

export const mockGeminiBreedDetectResponse = {
  primaryBreed: 'Golden Retriever',
  confidence: 95,
  species: 'dog' as const,
  colorPattern: 'Golden/cream solid coat',
  sizeCategory: 'large' as const,
  breedCharacteristics: ['Friendly', 'Intelligent', 'Devoted'],
  uaePopularity: 'very popular' as const,
  heatToleranceRating: 'fair' as const,
  averagePrice: '4000-10000 AED',
};

export const mockGeminiVetAdvisorResponse = {
  breedingReadiness: 'ready' as const,
  requiredTests: [
    { test: 'Hip & Elbow Scoring', reason: 'Breed prone to hip dysplasia', estimatedCostAED: '800-1200' },
    { test: 'DNA Panel', reason: 'Screen for PRA, ICT, MD', estimatedCostAED: '1500-2500' },
  ],
  optimalBreedingWindow: 'October-March (cooler months)',
  breedSpecificRisks: ['Hip dysplasia', 'Elbow dysplasia', 'Progressive retinal atrophy'],
  uaeClimateConsiderations: ['Avoid summer breeding - heat stress risk', 'Indoor whelping area with AC required'],
  recommendedVetVisitBefore: true,
  generalAdvice: 'Luna is at a good age for first breeding. Complete all health screening before proceeding.',
};
```

**Step 2: Create seed script**

Create `packages/db/src/seed.ts`:

```typescript
import { createDb } from './index';
import { users, pets } from './schema';
import { sampleUsers, samplePets } from '../../../fixtures/sample-data';

const db = createDb();

console.log('Seeding database...');
db.insert(users).values(sampleUsers).run();
db.insert(pets).values(samplePets).run();
console.log('Seeded 2 users and 2 pets.');
```

**Step 3: Write schema test**

Create `packages/db/tests/schema.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '../src/schema';
import { sampleUsers, samplePets } from '../../fixtures/sample-data';

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './packages/db/migrations' });
  return db;
}

describe('Database Schema', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('creates all tables without error', () => {
    const tables = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'"
    );
    const tableNames = tables.map((t: any) => t.name).sort();
    expect(tableNames).toEqual([
      'breeding_contracts', 'matches', 'messages', 'pets', 'users', 'vet_consultations'
    ]);
  });

  it('inserts and retrieves a user', () => {
    db.insert(schema.users).values(sampleUsers[0]).run();
    const result = db.select().from(schema.users).where(eq(schema.users.id, 'user-sarah-001')).get();
    expect(result?.name).toBe('Sarah Thompson');
    expect(result?.emirate).toBe('Dubai');
  });

  it('inserts a pet with foreign key to user', () => {
    db.insert(schema.users).values(sampleUsers[0]).run();
    db.insert(schema.pets).values(samplePets[0]).run();
    const pet = db.select().from(schema.pets).where(eq(schema.pets.id, 'pet-golden-001')).get();
    expect(pet?.breed).toBe('Golden Retriever');
    expect(pet?.ownerId).toBe('user-sarah-001');
  });

  it('rejects pet with invalid owner FK', () => {
    expect(() => {
      db.insert(schema.pets).values({ ...samplePets[0], ownerId: 'nonexistent' }).run();
    }).toThrow();
  });

  it('enforces unique email constraint', () => {
    db.insert(schema.users).values(sampleUsers[0]).run();
    expect(() => {
      db.insert(schema.users).values({ ...sampleUsers[0], id: 'different-id' }).run();
    }).toThrow();
  });
});
```

**Step 4: Run tests**

```bash
npx vitest run packages/db/tests/schema.test.ts
```

Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add fixtures/ packages/db/src/seed.ts packages/db/tests/
git commit -m "feat: add seed data, test fixtures, and schema tests"
```

---

## Phase 2: Server API Layer

### Task 4: Auth middleware + routes

**Files:**
- Create: `packages/server/src/middleware/auth.ts`
- Create: `packages/server/src/routes/auth.ts`
- Create: `packages/server/src/api-server.ts`
- Create: `packages/server/tests/api/auth.test.ts`

**Step 1: Write auth test**

Create `packages/server/tests/api/auth.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api-server';

describe('Auth API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(':memory:');
  });

  it('POST /api/auth/register creates a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Test1234!', name: 'Test User', emirate: 'Dubai' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/register rejects duplicate email', async () => {
    const payload = { email: 'dup@example.com', password: 'Test1234!', name: 'Dup', emirate: 'Dubai' };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login returns token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'Test1234!', name: 'Login', emirate: 'Dubai' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Test1234!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/login rejects wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'wrong@example.com', password: 'Test1234!', name: 'Wrong', emirate: 'Dubai' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'WrongPass!' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns user with valid token', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'me@example.com', password: 'Test1234!', name: 'Me', emirate: 'Dubai' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });

  it('GET /api/auth/me rejects missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run packages/server/tests/api/auth.test.ts
```

Expected: FAIL — `createApp` doesn't exist yet

**Step 3: Write auth middleware**

Create `packages/server/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'petpawsphere-dev-secret-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid token' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

**Step 4: Write auth routes**

Create `packages/server/src/routes/auth.ts`:

```typescript
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { users } from '@petpawsphere/db';
import { PetPawSphereDb } from '@petpawsphere/db';
import { signToken, requireAuth, AuthRequest } from '../middleware/auth';

export function authRouter(db: PetPawSphereDb): Router {
  const router = Router();

  router.post('/register', async (req, res) => {
    try {
      const { email, password, name, emirate, phone } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ error: 'email, password, and name are required' });
        return;
      }
      const existing = db.select().from(users).where(eq(users.email, email)).get();
      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      const id = uuid();
      const passwordHash = await bcrypt.hash(password, 10);
      db.insert(users).values({ id, email, passwordHash, name, emirate, phone }).run();
      const token = signToken(id);
      res.status(201).json({ token, user: { id, email, name, emirate } });
    } catch (err) {
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }
    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, emirate: user.emirate } });
  });

  router.get('/me', requireAuth, (req: AuthRequest, res) => {
    const user = db.select().from(users).where(eq(users.id, req.userId!)).get();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { passwordHash, ...safe } = user;
    res.json(safe);
  });

  return router;
}
```

**Step 5: Write api-server.ts (Express app factory)**

Create `packages/server/src/api-server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { createDb } from '@petpawsphere/db';
import { authRouter } from './routes/auth';

export function createApp(dbPath: string = './petpawsphere.db') {
  const db = createDb(dbPath);
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRouter(db));

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3001;
  const app = createApp();
  app.listen(port, () => console.log(`PetPawSphere API running on http://localhost:${port}`));
}
```

**Step 6: Run tests**

```bash
npx vitest run packages/server/tests/api/auth.test.ts
```

Expected: 6 tests PASS

**Step 7: Commit**

```bash
git add packages/server/src/middleware/ packages/server/src/routes/auth.ts packages/server/src/api-server.ts packages/server/tests/
git commit -m "feat: add auth API with JWT, register, login, and me endpoint"
```

---

### Task 5: Pets CRUD routes

**Files:**
- Create: `packages/server/src/routes/pets.ts`
- Create: `packages/server/tests/api/pets.test.ts`
- Modify: `packages/server/src/api-server.ts` (add pets router)

**Step 1: Write pets test**

Create `packages/server/tests/api/pets.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api-server';

async function registerAndGetToken(app: any, email = 'owner@test.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'Test1234!', name: 'Owner', emirate: 'Dubai' });
  return res.body.token;
}

describe('Pets API', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(async () => {
    app = createApp(':memory:');
    token = await registerAndGetToken(app);
  });

  it('POST /api/pets creates a pet', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Luna', species: 'dog', breed: 'Golden Retriever', age: 3, gender: 'female', weight: 28, location: 'Dubai', isNeutered: false });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Luna');
    expect(res.body.ownerId).toBeDefined();
  });

  it('GET /api/pets lists pets', async () => {
    await request(app).post('/api/pets').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Luna', species: 'dog', breed: 'Golden Retriever', age: 3, gender: 'female', weight: 28, location: 'Dubai', isNeutered: false });
    const res = await request(app).get('/api/pets').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('GET /api/pets filters by species', async () => {
    await request(app).post('/api/pets').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Luna', species: 'dog', breed: 'GR', age: 3, gender: 'female', weight: 28, location: 'Dubai', isNeutered: false });
    await request(app).post('/api/pets').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mimi', species: 'cat', breed: 'Persian', age: 2, gender: 'female', weight: 4, location: 'Dubai', isNeutered: false });
    const res = await request(app).get('/api/pets?species=cat').set('Authorization', `Bearer ${token}`);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Mimi');
  });

  it('PUT /api/pets/:id updates own pet', async () => {
    const create = await request(app).post('/api/pets').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Luna', species: 'dog', breed: 'GR', age: 3, gender: 'female', weight: 28, location: 'Dubai', isNeutered: false });
    const res = await request(app).put(`/api/pets/${create.body.id}`).set('Authorization', `Bearer ${token}`)
      .send({ name: 'Luna Star' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Luna Star');
  });

  it('PUT /api/pets/:id rejects non-owner', async () => {
    const create = await request(app).post('/api/pets').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Luna', species: 'dog', breed: 'GR', age: 3, gender: 'female', weight: 28, location: 'Dubai', isNeutered: false });
    const otherToken = await registerAndGetToken(app, 'other@test.com');
    const res = await request(app).put(`/api/pets/${create.body.id}`).set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/pets/:id soft deletes', async () => {
    const create = await request(app).post('/api/pets').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Luna', species: 'dog', breed: 'GR', age: 3, gender: 'female', weight: 28, location: 'Dubai', isNeutered: false });
    const res = await request(app).delete(`/api/pets/${create.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const list = await request(app).get('/api/pets').set('Authorization', `Bearer ${token}`);
    expect(list.body.length).toBe(0);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/pets');
    expect(res.status).toBe(401);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run packages/server/tests/api/pets.test.ts
```

Expected: FAIL — petsRouter not found

**Step 3: Write pets routes**

Create `packages/server/src/routes/pets.ts`:

```typescript
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq, and, sql } from 'drizzle-orm';
import { pets } from '@petpawsphere/db';
import { PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export function petsRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req: AuthRequest, res) => {
    const { species, breed, emirate, gender } = req.query;
    let query = db.select().from(pets).where(eq(pets.status, 'active'));

    const conditions = [eq(pets.status, 'active')];
    if (species) conditions.push(eq(pets.species, species as string));
    if (breed) conditions.push(eq(pets.breed, breed as string));
    if (emirate) conditions.push(eq(pets.location, emirate as string));
    if (gender) conditions.push(eq(pets.gender, gender as string));

    const results = db.select().from(pets).where(and(...conditions)).all();
    res.json(results);
  });

  router.get('/:id', (req: AuthRequest, res) => {
    const pet = db.select().from(pets).where(eq(pets.id, req.params.id)).get();
    if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }
    res.json(pet);
  });

  router.post('/', (req: AuthRequest, res) => {
    const { name, species: sp, breed, age, gender, weight, location, temperament, pedigree, healthRecords, dnaTestResults, isNeutered, photoUrls } = req.body;
    if (!name || !sp || !breed || age == null || !gender || weight == null || !location) {
      res.status(400).json({ error: 'Missing required fields' }); return;
    }
    const id = uuid();
    db.insert(pets).values({
      id, ownerId: req.userId!, name, species: sp, breed, age, gender, weight, location,
      temperament, pedigree, isNeutered: isNeutered ?? false,
      healthRecords: healthRecords ? JSON.stringify(healthRecords) : '[]',
      dnaTestResults, photoUrls: photoUrls ? JSON.stringify(photoUrls) : '[]',
    }).run();
    const pet = db.select().from(pets).where(eq(pets.id, id)).get();
    res.status(201).json(pet);
  });

  router.put('/:id', (req: AuthRequest, res) => {
    const pet = db.select().from(pets).where(eq(pets.id, req.params.id)).get();
    if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }
    if (pet.ownerId !== req.userId) { res.status(403).json({ error: 'Not your pet' }); return; }
    const updates: Record<string, any> = {};
    for (const key of ['name', 'breed', 'age', 'gender', 'weight', 'location', 'temperament', 'pedigree', 'dnaTestResults', 'isNeutered']) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.healthRecords) updates.healthRecords = JSON.stringify(req.body.healthRecords);
    if (req.body.photoUrls) updates.photoUrls = JSON.stringify(req.body.photoUrls);
    updates.updatedAt = new Date().toISOString();
    db.update(pets).set(updates).where(eq(pets.id, req.params.id)).run();
    const updated = db.select().from(pets).where(eq(pets.id, req.params.id)).get();
    res.json(updated);
  });

  router.delete('/:id', (req: AuthRequest, res) => {
    const pet = db.select().from(pets).where(eq(pets.id, req.params.id)).get();
    if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }
    if (pet.ownerId !== req.userId) { res.status(403).json({ error: 'Not your pet' }); return; }
    db.update(pets).set({ status: 'inactive', updatedAt: new Date().toISOString() }).where(eq(pets.id, req.params.id)).run();
    res.json({ message: 'Pet deactivated' });
  });

  return router;
}
```

**Step 4: Add pets router to api-server.ts**

Add to `packages/server/src/api-server.ts` after auth router:

```typescript
import { petsRouter } from './routes/pets';
// ... after authRouter line:
app.use('/api/pets', petsRouter(db));
```

**Step 5: Run tests**

```bash
npx vitest run packages/server/tests/api/pets.test.ts
```

Expected: 7 tests PASS

**Step 6: Commit**

```bash
git add packages/server/src/routes/pets.ts packages/server/src/api-server.ts packages/server/tests/api/pets.test.ts
git commit -m "feat: add pets CRUD API with ownership checks and filters"
```

---

### Task 6: Matches + AI flow integration routes

**Files:**
- Create: `packages/server/src/routes/matches.ts`
- Create: `packages/server/tests/api/matches.test.ts`
- Modify: `packages/server/src/api-server.ts`

**Step 1: Write matches test**

Create `packages/server/tests/api/matches.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api-server';

// Mock the petMatch flow to avoid calling Gemini
vi.mock('../../src/flows/pet-match', () => ({
  petMatchFlow: vi.fn().mockResolvedValue({
    compatibilityScore: 85,
    geneticHealthRisk: 'low',
    breedCompatibility: 'good',
    temperamentMatch: 'excellent',
    locationProximity: 'Same city',
    recommendation: 'Great match',
    warnings: [],
    breedingTips: ['Schedule vet check'],
  }),
}));

describe('Matches API', () => {
  let app: ReturnType<typeof createApp>;
  let tokenA: string;
  let tokenB: string;
  let petAId: string;
  let petBId: string;

  beforeEach(async () => {
    app = createApp(':memory:');

    const regA = await request(app).post('/api/auth/register')
      .send({ email: 'a@test.com', password: 'Test1234!', name: 'Owner A', emirate: 'Dubai' });
    tokenA = regA.body.token;

    const regB = await request(app).post('/api/auth/register')
      .send({ email: 'b@test.com', password: 'Test1234!', name: 'Owner B', emirate: 'Dubai' });
    tokenB = regB.body.token;

    const petA = await request(app).post('/api/pets').set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Luna', species: 'dog', breed: 'Golden Retriever', age: 3, gender: 'female', weight: 28, location: 'Dubai', isNeutered: false });
    petAId = petA.body.id;

    const petB = await request(app).post('/api/pets').set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Max', species: 'dog', breed: 'Golden Retriever', age: 4, gender: 'male', weight: 32, location: 'Dubai', isNeutered: false });
    petBId = petB.body.id;
  });

  it('POST /api/matches/analyze creates a match with AI results', async () => {
    const res = await request(app).post('/api/matches/analyze').set('Authorization', `Bearer ${tokenA}`)
      .send({ petAId, petBId });
    expect(res.status).toBe(201);
    expect(res.body.compatibilityScore).toBe(85);
    expect(res.body.status).toBe('pending');
  });

  it('GET /api/matches lists user matches', async () => {
    await request(app).post('/api/matches/analyze').set('Authorization', `Bearer ${tokenA}`)
      .send({ petAId, petBId });
    const res = await request(app).get('/api/matches').set('Authorization', `Bearer ${tokenA}`);
    expect(res.body.length).toBe(1);
  });

  it('PUT /api/matches/:id/respond accepts a match', async () => {
    const match = await request(app).post('/api/matches/analyze').set('Authorization', `Bearer ${tokenA}`)
      .send({ petAId, petBId });
    const res = await request(app).put(`/api/matches/${match.body.id}/respond`).set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'accepted' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
  });
});
```

**Step 2: Write matches routes**

Create `packages/server/src/routes/matches.ts`:

```typescript
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq, or } from 'drizzle-orm';
import { matches, pets } from '@petpawsphere/db';
import { PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export function matchesRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  router.post('/analyze', async (req: AuthRequest, res) => {
    try {
      const { petAId, petBId } = req.body;
      const petA = db.select().from(pets).where(eq(pets.id, petAId)).get();
      const petB = db.select().from(pets).where(eq(pets.id, petBId)).get();
      if (!petA || !petB) { res.status(404).json({ error: 'Pet not found' }); return; }

      const { petMatchFlow } = await import('../flows/pet-match');
      const result = await petMatchFlow({
        petA: { name: petA.name, species: petA.species, breed: petA.breed, age: petA.age, gender: petA.gender, weight: petA.weight, location: petA.location, isNeutered: petA.isNeutered, temperament: petA.temperament ?? undefined, pedigree: petA.pedigree ?? undefined, healthRecords: JSON.parse(petA.healthRecords), dnaTestResults: petA.dnaTestResults ?? undefined },
        petB: { name: petB.name, species: petB.species, breed: petB.breed, age: petB.age, gender: petB.gender, weight: petB.weight, location: petB.location, isNeutered: petB.isNeutered, temperament: petB.temperament ?? undefined, pedigree: petB.pedigree ?? undefined, healthRecords: JSON.parse(petB.healthRecords), dnaTestResults: petB.dnaTestResults ?? undefined },
      });

      const id = uuid();
      db.insert(matches).values({
        id, petAId, petBId, requestedBy: req.userId!,
        compatibilityScore: result.compatibilityScore,
        geneticHealthRisk: result.geneticHealthRisk,
        breedCompatibility: result.breedCompatibility,
        temperamentMatch: result.temperamentMatch,
        locationProximity: result.locationProximity,
        recommendation: result.recommendation,
        warnings: JSON.stringify(result.warnings),
        breedingTips: JSON.stringify(result.breedingTips),
      }).run();

      const match = db.select().from(matches).where(eq(matches.id, id)).get();
      res.status(201).json(match);
    } catch (err) {
      res.status(500).json({ error: 'Match analysis failed' });
    }
  });

  router.get('/', (req: AuthRequest, res) => {
    const userPets = db.select().from(pets).where(eq(pets.ownerId, req.userId!)).all();
    const petIds = userPets.map(p => p.id);
    if (petIds.length === 0) { res.json([]); return; }
    const allMatches = db.select().from(matches).all()
      .filter(m => petIds.includes(m.petAId) || petIds.includes(m.petBId));
    res.json(allMatches);
  });

  router.get('/:id', (req: AuthRequest, res) => {
    const match = db.select().from(matches).where(eq(matches.id, req.params.id)).get();
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
    res.json(match);
  });

  router.put('/:id/respond', (req: AuthRequest, res) => {
    const match = db.select().from(matches).where(eq(matches.id, req.params.id)).get();
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be accepted or rejected' }); return;
    }
    db.update(matches).set({ status, updatedAt: new Date().toISOString() }).where(eq(matches.id, req.params.id)).run();
    const updated = db.select().from(matches).where(eq(matches.id, req.params.id)).get();
    res.json(updated);
  });

  return router;
}
```

**Step 3: Add to api-server.ts**

```typescript
import { matchesRouter } from './routes/matches';
app.use('/api/matches', matchesRouter(db));
```

**Step 4: Run tests**

```bash
npx vitest run packages/server/tests/api/matches.test.ts
```

Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add packages/server/src/routes/matches.ts packages/server/tests/api/matches.test.ts packages/server/src/api-server.ts
git commit -m "feat: add matches API with AI-powered compatibility analysis"
```

---

### Task 7: Messages routes

**Files:**
- Create: `packages/server/src/routes/messages.ts`
- Modify: `packages/server/src/api-server.ts`

**Step 1: Write messages routes**

Create `packages/server/src/routes/messages.ts`:

```typescript
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { messages, matches, pets } from '@petpawsphere/db';
import { PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export function messagesRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  function isMatchParticipant(db: PetPawSphereDb, matchId: string, userId: string): boolean {
    const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
    if (!match) return false;
    const petA = db.select().from(pets).where(eq(pets.id, match.petAId)).get();
    const petB = db.select().from(pets).where(eq(pets.id, match.petBId)).get();
    return petA?.ownerId === userId || petB?.ownerId === userId;
  }

  router.get('/:matchId', (req: AuthRequest, res) => {
    if (!isMatchParticipant(db, req.params.matchId, req.userId!)) {
      res.status(403).json({ error: 'Not a participant in this match' }); return;
    }
    const msgs = db.select().from(messages).where(eq(messages.matchId, req.params.matchId)).all();
    res.json(msgs);
  });

  router.post('/:matchId', (req: AuthRequest, res) => {
    if (!isMatchParticipant(db, req.params.matchId, req.userId!)) {
      res.status(403).json({ error: 'Not a participant in this match' }); return;
    }
    const match = db.select().from(matches).where(eq(matches.id, req.params.matchId)).get();
    if (match?.status !== 'accepted') {
      res.status(400).json({ error: 'Match must be accepted before messaging' }); return;
    }
    const { content } = req.body;
    if (!content) { res.status(400).json({ error: 'Content required' }); return; }
    const id = uuid();
    db.insert(messages).values({ id, matchId: req.params.matchId, senderId: req.userId!, content }).run();
    const msg = db.select().from(messages).where(eq(messages.id, id)).get();
    res.status(201).json(msg);
  });

  return router;
}
```

**Step 2: Add to api-server.ts**

```typescript
import { messagesRouter } from './routes/messages';
app.use('/api/messages', messagesRouter(db));
```

**Step 3: Commit**

```bash
git add packages/server/src/routes/messages.ts packages/server/src/api-server.ts
git commit -m "feat: add messages API with match-gated access"
```

---

### Task 8: AI tools + contracts + resources routes

**Files:**
- Create: `packages/server/src/routes/ai-tools.ts`
- Create: `packages/server/src/routes/contracts.ts`
- Create: `packages/server/src/routes/resources.ts`
- Modify: `packages/server/src/api-server.ts`

**Step 1: Write AI tools routes**

Create `packages/server/src/routes/ai-tools.ts`:

```typescript
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { pets, vetConsultations } from '@petpawsphere/db';
import { PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export function aiToolsRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  router.post('/breed-detect', async (req: AuthRequest, res) => {
    try {
      const { breedDetectFlow } = await import('../flows/breed-detect');
      const result = await breedDetectFlow(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Breed detection failed' });
    }
  });

  router.post('/translate', async (req: AuthRequest, res) => {
    try {
      const { translateFlow } = await import('../flows/translate');
      const result = await translateFlow(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Translation failed' });
    }
  });

  router.post('/profile-review/:petId', async (req: AuthRequest, res) => {
    try {
      const pet = db.select().from(pets).where(eq(pets.id, req.params.petId)).get();
      if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }
      const { profileReviewFlow } = await import('../flows/profile-review');
      const result = await profileReviewFlow({
        profile: { name: pet.name, species: pet.species, breed: pet.breed, age: pet.age, gender: pet.gender, weight: pet.weight, location: pet.location, isNeutered: pet.isNeutered, temperament: pet.temperament ?? undefined, pedigree: pet.pedigree ?? undefined, healthRecords: JSON.parse(pet.healthRecords), dnaTestResults: pet.dnaTestResults ?? undefined },
        photoCount: JSON.parse(pet.photoUrls).length,
        hasVerifiedOwner: req.body.hasVerifiedOwner ?? false,
        accountAge: req.body.accountAge ?? 0,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Profile review failed' });
    }
  });

  router.post('/vet-advisor/:petId', async (req: AuthRequest, res) => {
    try {
      const pet = db.select().from(pets).where(eq(pets.id, req.params.petId)).get();
      if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }
      const { vetAdvisorFlow } = await import('../flows/vet-advisor');
      const input = { species: pet.species, breed: pet.breed, age: pet.age, gender: pet.gender, weight: pet.weight, ...req.body };
      const result = await vetAdvisorFlow(input);

      const id = uuid();
      db.insert(vetConsultations).values({
        id, petId: pet.id, requestedBy: req.userId!,
        breedingReadiness: result.breedingReadiness,
        requiredTests: JSON.stringify(result.requiredTests),
        breedSpecificRisks: JSON.stringify(result.breedSpecificRisks),
        uaeClimateConsiderations: JSON.stringify(result.uaeClimateConsiderations),
        generalAdvice: result.generalAdvice,
      }).run();

      res.json({ ...result, consultationId: id });
    } catch (err) {
      res.status(500).json({ error: 'Vet advisor failed' });
    }
  });

  return router;
}
```

**Step 2: Write contracts routes**

Create `packages/server/src/routes/contracts.ts`:

```typescript
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { breedingContracts, matches, pets } from '@petpawsphere/db';
import { PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export function contractsRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  router.post('/', async (req: AuthRequest, res) => {
    try {
      const { matchId, studFeeAED, terms } = req.body;
      const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
      if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
      const petA = db.select().from(pets).where(eq(pets.id, match.petAId)).get();
      const petB = db.select().from(pets).where(eq(pets.id, match.petBId)).get();
      if (!petA || !petB) { res.status(404).json({ error: 'Pets not found' }); return; }

      const id = uuid();
      db.insert(breedingContracts).values({
        id, matchId, ownerAId: petA.ownerId, ownerBId: petB.ownerId,
        studFeeAED, terms, contractText: `Breeding agreement for ${petA.name} and ${petB.name}. Generated by PetPawSphere.`,
      }).run();

      const contract = db.select().from(breedingContracts).where(eq(breedingContracts.id, id)).get();
      res.status(201).json(contract);
    } catch (err) {
      res.status(500).json({ error: 'Contract creation failed' });
    }
  });

  router.get('/:id', (req: AuthRequest, res) => {
    const contract = db.select().from(breedingContracts).where(eq(breedingContracts.id, req.params.id)).get();
    if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
    res.json(contract);
  });

  router.put('/:id', (req: AuthRequest, res) => {
    const contract = db.select().from(breedingContracts).where(eq(breedingContracts.id, req.params.id)).get();
    if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
    if (contract.ownerAId !== req.userId && contract.ownerBId !== req.userId) {
      res.status(403).json({ error: 'Not a party to this contract' }); return;
    }
    const { status } = req.body;
    db.update(breedingContracts).set({ status, updatedAt: new Date().toISOString() }).where(eq(breedingContracts.id, req.params.id)).run();
    const updated = db.select().from(breedingContracts).where(eq(breedingContracts.id, req.params.id)).get();
    res.json(updated);
  });

  return router;
}
```

**Step 3: Write resources routes**

Create `packages/server/src/routes/resources.ts`:

```typescript
import { Router } from 'express';

export function resourcesRouter(): Router {
  const router = Router();

  const uaeBreeds = {
    dogs: [
      { breed: 'Saluki', origin: 'Middle East', popularity: 1, avgPriceAED: '5000-15000' },
      { breed: 'German Shepherd', origin: 'Germany', popularity: 2, avgPriceAED: '3000-8000' },
      { breed: 'Golden Retriever', origin: 'UK', popularity: 3, avgPriceAED: '4000-10000' },
      { breed: 'French Bulldog', origin: 'France', popularity: 4, avgPriceAED: '8000-25000' },
      { breed: 'Labrador Retriever', origin: 'Canada', popularity: 5, avgPriceAED: '3000-7000' },
      { breed: 'Husky', origin: 'Siberia', popularity: 6, avgPriceAED: '4000-12000', note: 'Needs AC, poor heat tolerance' },
      { breed: 'Pomeranian', origin: 'Germany', popularity: 7, avgPriceAED: '3000-8000' },
      { breed: 'Shih Tzu', origin: 'China', popularity: 8, avgPriceAED: '2000-6000' },
    ],
    cats: [
      { breed: 'Persian', origin: 'Iran', popularity: 1, avgPriceAED: '2000-8000' },
      { breed: 'British Shorthair', origin: 'UK', popularity: 2, avgPriceAED: '3000-10000' },
      { breed: 'Maine Coon', origin: 'USA', popularity: 3, avgPriceAED: '5000-15000' },
      { breed: 'Ragdoll', origin: 'USA', popularity: 4, avgPriceAED: '4000-12000' },
      { breed: 'Scottish Fold', origin: 'Scotland', popularity: 5, avgPriceAED: '3000-10000' },
      { breed: 'Bengal', origin: 'USA', popularity: 6, avgPriceAED: '5000-20000' },
    ],
  };

  const uaeVets = {
    note: 'Sample directory - integrate with real API in production',
    clinics: [
      { name: 'Modern Vet', location: 'Dubai', services: ['DNA Testing', 'Pre-breeding checks', 'AI insemination'], area: 'Jumeirah' },
      { name: 'British Veterinary Hospital', location: 'Abu Dhabi', services: ['Genetic screening', 'Breeding consultation'], area: 'Khalifa City' },
      { name: 'Canadian Veterinary Clinic', location: 'Dubai', services: ['Breed certification', 'Health checks'], area: 'Umm Suqeim' },
      { name: 'Abu Dhabi Falcon Hospital', location: 'Abu Dhabi', services: ['Exotic breeds', 'Raptor breeding'], area: 'Sweihan' },
    ],
  };

  router.get('/breeds', (_req, res) => res.json(uaeBreeds));
  router.get('/vets', (_req, res) => res.json(uaeVets));

  return router;
}
```

**Step 4: Wire all routes into api-server.ts**

Final `packages/server/src/api-server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { createDb } from '@petpawsphere/db';
import { authRouter } from './routes/auth';
import { petsRouter } from './routes/pets';
import { matchesRouter } from './routes/matches';
import { messagesRouter } from './routes/messages';
import { aiToolsRouter } from './routes/ai-tools';
import { contractsRouter } from './routes/contracts';
import { resourcesRouter } from './routes/resources';

export function createApp(dbPath: string = './petpawsphere.db') {
  const db = createDb(dbPath);
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRouter(db));
  app.use('/api/pets', petsRouter(db));
  app.use('/api/matches', matchesRouter(db));
  app.use('/api/messages', messagesRouter(db));
  app.use('/api', aiToolsRouter(db));
  app.use('/api/contracts', contractsRouter(db));
  app.use('/api/resources', resourcesRouter());

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3001;
  const app = createApp();
  app.listen(port, () => console.log(`PetPawSphere API running on http://localhost:${port}`));
}
```

**Step 5: Run all server tests**

```bash
npx vitest run packages/server/tests/
```

Expected: All tests PASS

**Step 6: Commit**

```bash
git add packages/server/src/routes/ packages/server/src/api-server.ts
git commit -m "feat: add AI tools, contracts, messages, and resources routes"
```

---

## Phase 3: React Frontend

### Task 9: Scaffold React + Vite app

**Step 1: Create Vite project**

```bash
cd packages
npm create vite@latest web -- --template react-ts
cd web
```

**Step 2: Create packages/web/package.json**

```json
{
  "name": "@petpawsphere/web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.2.0",
    "@tanstack/react-query": "^5.75.0",
    "react-hook-form": "^7.56.0",
    "@hookform/resolvers": "^5.0.0",
    "zod": "^4.3.6",
    "react-i18next": "^15.5.0",
    "i18next": "^25.1.0",
    "lucide-react": "^0.511.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.5.0",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.9.3",
    "vite": "^6.3.0"
  }
}
```

**Step 3: Install and configure Tailwind**

```bash
npx tailwindcss init -p
```

Update `packages/web/src/index.css`:

```css
@import "tailwindcss";
```

**Step 4: Configure Vite proxy**

Create `packages/web/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

**Step 5: Install shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card input label badge tabs dialog select textarea avatar separator
```

**Step 6: Commit**

```bash
git add packages/web/
git commit -m "feat: scaffold React + Vite frontend with Tailwind and shadcn/ui"
```

---

### Task 10: Auth context + API client

**Files:**
- Create: `packages/web/src/lib/api.ts`
- Create: `packages/web/src/lib/auth-context.tsx`
- Create: `packages/web/src/lib/utils.ts`

**Step 1: Write API client**

Create `packages/web/src/lib/api.ts`:

```typescript
const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('petpawsphere_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string; emirate: string }) =>
      request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<any>('/auth/me'),
  },
  pets: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/pets${qs}`);
    },
    get: (id: string) => request<any>(`/pets/${id}`),
    create: (data: any) => request<any>('/pets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/pets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/pets/${id}`, { method: 'DELETE' }),
  },
  matches: {
    analyze: (petAId: string, petBId: string) =>
      request<any>('/matches/analyze', { method: 'POST', body: JSON.stringify({ petAId, petBId }) }),
    list: () => request<any[]>('/matches'),
    get: (id: string) => request<any>(`/matches/${id}`),
    respond: (id: string, status: string) =>
      request<any>(`/matches/${id}/respond`, { method: 'PUT', body: JSON.stringify({ status }) }),
  },
  messages: {
    list: (matchId: string) => request<any[]>(`/messages/${matchId}`),
    send: (matchId: string, content: string) =>
      request<any>(`/messages/${matchId}`, { method: 'POST', body: JSON.stringify({ content }) }),
  },
  tools: {
    breedDetect: (data: any) => request<any>('/breed-detect', { method: 'POST', body: JSON.stringify(data) }),
    translate: (data: any) => request<any>('/translate', { method: 'POST', body: JSON.stringify(data) }),
    profileReview: (petId: string, data?: any) =>
      request<any>(`/profile-review/${petId}`, { method: 'POST', body: JSON.stringify(data || {}) }),
    vetAdvisor: (petId: string, data?: any) =>
      request<any>(`/vet-advisor/${petId}`, { method: 'POST', body: JSON.stringify(data || {}) }),
  },
  contracts: {
    create: (data: any) => request<any>('/contracts', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => request<any>(`/contracts/${id}`),
    update: (id: string, status: string) =>
      request<any>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  },
  resources: {
    breeds: () => request<any>('/resources/breeds'),
    vets: () => request<any>('/resources/vets'),
  },
};
```

**Step 2: Write auth context**

Create `packages/web/src/lib/auth-context.tsx`:

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User { id: string; email: string; name: string; emirate: string; role: string; }
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; emirate: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('petpawsphere_token');
    if (token) {
      api.auth.me().then(setUser).catch(() => localStorage.removeItem('petpawsphere_token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.auth.login({ email, password });
    localStorage.setItem('petpawsphere_token', token);
    setUser(user);
  };

  const register = async (data: { email: string; password: string; name: string; emirate: string }) => {
    const { token, user } = await api.auth.register(data);
    localStorage.setItem('petpawsphere_token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('petpawsphere_token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

**Step 3: Commit**

```bash
git add packages/web/src/lib/
git commit -m "feat: add API client and auth context"
```

---

### Task 11: App shell + routing + landing page

**Files:**
- Create: `packages/web/src/App.tsx`
- Create: `packages/web/src/pages/Landing.tsx`
- Create: `packages/web/src/pages/Login.tsx`
- Create: `packages/web/src/pages/Register.tsx`
- Create: `packages/web/src/pages/Dashboard.tsx`
- Create: `packages/web/src/components/Navbar.tsx`
- Create: `packages/web/src/components/ProtectedRoute.tsx`

This task builds all 6 files. Code is provided in the design doc for each page. The key architectural choices:

- `<BrowserRouter>` wrapping `<AuthProvider>` wrapping `<QueryClientProvider>`
- `<ProtectedRoute>` component checks `useAuth().user` and redirects to `/login`
- Navbar shows user name + logout when authenticated, login/register when not
- Landing page: hero section with tagline, 3 feature cards, CTA button

**Step 1: Build all files (see complete code in each file)**

**Step 2: Verify dev server starts**

```bash
cd packages/web && npm run dev
```

Expected: Vite dev server on port 5173, landing page renders

**Step 3: Commit**

```bash
git add packages/web/src/
git commit -m "feat: add app shell with routing, auth pages, and landing page"
```

---

### Task 12: Pet pages (list, create, detail, edit)

**Files:**
- Create: `packages/web/src/pages/PetsList.tsx`
- Create: `packages/web/src/pages/PetCreate.tsx`
- Create: `packages/web/src/pages/PetDetail.tsx`
- Create: `packages/web/src/pages/PetEdit.tsx`
- Create: `packages/web/src/components/PetCard.tsx`

Key components:
- `PetCard`: photo placeholder, breed badge, location, gender icon, quick-match button
- `PetsList`: grid of PetCards with species/breed/emirate filter dropdowns (TanStack Query)
- `PetCreate`: multi-step form (React Hook Form + Zod) — step 1: basic info, step 2: health records, step 3: photos
- `PetDetail`: full profile with gallery, stats grid, "Find a Match" CTA
- `PetEdit`: pre-filled form with same structure as create

**Step 1: Build components and pages**

**Step 2: Add routes to App.tsx**

**Step 3: Verify by creating a pet through the UI**

**Step 4: Commit**

```bash
git add packages/web/src/pages/Pet* packages/web/src/components/PetCard.tsx
git commit -m "feat: add pet list, create, detail, and edit pages"
```

---

### Task 13: Match pages + CompatibilityCard

**Files:**
- Create: `packages/web/src/pages/MatchesList.tsx`
- Create: `packages/web/src/pages/MatchDetail.tsx`
- Create: `packages/web/src/components/CompatibilityCard.tsx`

Key components:
- `CompatibilityCard`: circular progress for score (CSS conic-gradient), colored risk badges, recommendation text, expandable warnings/tips
- `MatchesList`: tabbed view (pending/accepted/completed), each match shows both pets + score
- `MatchDetail`: CompatibilityCard + chat thread + contract section

**Step 1: Build components**

**Step 2: Add routes**

**Step 3: Commit**

```bash
git add packages/web/src/pages/Match* packages/web/src/components/CompatibilityCard.tsx
git commit -m "feat: add match pages with compatibility card"
```

---

### Task 14: AI tool pages (breed detect, translate, vet advisor)

**Files:**
- Create: `packages/web/src/pages/BreedDetect.tsx`
- Create: `packages/web/src/pages/Translate.tsx`
- Create: `packages/web/src/pages/VetAdvisor.tsx`
- Create: `packages/web/src/components/BreedDetectResult.tsx`
- Create: `packages/web/src/components/VetAdvisorReport.tsx`

Key UX:
- `BreedDetect`: image URL input or text description textarea, submit button, result card with breed info + UAE stats
- `Translate`: source text input, target language toggle (AR/EN), context dropdown, result with detected language
- `VetAdvisor`: select pet from dropdown (pre-fills species/breed/age), optional question field, result as structured report card

**Step 1: Build pages and components**

**Step 2: Add routes**

**Step 3: Commit**

```bash
git add packages/web/src/pages/Breed* packages/web/src/pages/Translate.tsx packages/web/src/pages/VetAdvisor.tsx packages/web/src/components/Breed* packages/web/src/components/Vet*
git commit -m "feat: add AI tool pages - breed detect, translate, vet advisor"
```

---

### Task 15: Chat + messaging pages

**Files:**
- Create: `packages/web/src/pages/Messages.tsx`
- Create: `packages/web/src/pages/ChatThread.tsx`
- Create: `packages/web/src/components/ChatBubble.tsx`

Key UX:
- `Messages`: list of conversations grouped by match, shows last message preview
- `ChatThread`: message bubbles (own = right/blue, other = left/gray), auto-scroll to bottom, input bar with send button
- Polling: TanStack Query `refetchInterval: 5000` for new messages

**Step 1: Build chat components**

**Step 2: Add routes**

**Step 3: Commit**

```bash
git add packages/web/src/pages/Messages.tsx packages/web/src/pages/ChatThread.tsx packages/web/src/components/ChatBubble.tsx
git commit -m "feat: add messaging pages with chat thread"
```

---

### Task 16: Profile + i18n setup

**Files:**
- Create: `packages/web/src/pages/Profile.tsx`
- Create: `packages/web/src/pages/Verification.tsx`
- Create: `packages/web/src/i18n/index.ts`
- Create: `packages/web/src/i18n/en.json`
- Create: `packages/web/src/i18n/ar.json`

Key details:
- Profile: edit name, phone, emirate, avatar
- Verification: KYC flow placeholder (upload ID, selfie — UI only, no real KYC)
- i18n: key strings for navbar, common labels, CTA buttons in both languages
- RTL: `document.dir = 'rtl'` when Arabic selected

**Step 1: Build profile pages**

**Step 2: Set up i18next**

**Step 3: Add language toggle to Navbar**

**Step 4: Commit**

```bash
git add packages/web/src/pages/Profile.tsx packages/web/src/pages/Verification.tsx packages/web/src/i18n/
git commit -m "feat: add profile pages and Arabic/English i18n"
```

---

## Phase 4: Flow Tests

### Task 17: Vitest flow tests with mocked Gemini

**Files:**
- Create: `packages/server/tests/flows/pet-match.test.ts`
- Create: `packages/server/tests/flows/breed-detect.test.ts`
- Create: `packages/server/tests/flows/translate.test.ts`
- Create: `packages/server/tests/flows/profile-review.test.ts`
- Create: `packages/server/tests/flows/vet-advisor.test.ts`

**Step 1: Write pet-match flow test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockGeminiMatchResponse } from '../../../fixtures/sample-data';

// Mock Genkit's ai.generate to return deterministic data
vi.mock('../../src/genkit', () => ({
  ai: {
    defineFlow: vi.fn((_config, handler) => handler),
    generate: vi.fn().mockResolvedValue({ output: mockGeminiMatchResponse }),
  },
  PetProfileSchema: {} as any,
  MatchResultSchema: {} as any,
}));

describe('petMatch flow', () => {
  it('returns a compatibility result with valid score', async () => {
    const { petMatchFlow } = await import('../../src/flows/pet-match');
    const result = await petMatchFlow({
      petA: { name: 'Luna', species: 'dog', breed: 'Golden Retriever', age: 3, gender: 'female', weight: 28, location: 'Dubai', isNeutered: false },
      petB: { name: 'Max', species: 'dog', breed: 'Golden Retriever', age: 4, gender: 'male', weight: 32, location: 'Dubai', isNeutered: false },
    });
    expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
    expect(result.compatibilityScore).toBeLessThanOrEqual(100);
    expect(result.geneticHealthRisk).toMatch(/low|medium|high/);
    expect(result.warnings).toBeInstanceOf(Array);
  });
});
```

**Step 2: Write remaining flow tests (similar pattern with corresponding mock data)**

**Step 3: Run all flow tests**

```bash
npx vitest run packages/server/tests/flows/
```

Expected: 5 test files PASS

**Step 4: Commit**

```bash
git add packages/server/tests/flows/
git commit -m "test: add flow tests with mocked Gemini responses"
```

---

### Task 18: Vitest config + full test run

**Files:**
- Create: `vitest.config.ts` (root)

**Step 1: Write vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/tests/**/*.test.ts'],
    globals: true,
  },
});
```

**Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: All DB, API, and flow tests pass.

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add root vitest config and verify full test suite"
```

---

## Phase 5: Integration + Polish

### Task 19: Dev startup script

**Files:**
- Modify: root `package.json` scripts

**Step 1: Add concurrently for parallel dev servers**

```bash
npm i -D concurrently
```

**Step 2: Update root package.json scripts**

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev -w @petpawsphere/server\" \"npm run dev -w @petpawsphere/web\"",
    "build": "npm run build --workspaces",
    "test": "vitest run",
    "db:generate": "npm run generate -w @petpawsphere/db",
    "db:migrate": "npm run migrate -w @petpawsphere/db",
    "db:seed": "npm run seed -w @petpawsphere/db",
    "mcp": "npm run mcp -w @petpawsphere/server"
  }
}
```

**Step 3: Verify `npm run dev` starts both servers**

```bash
npm run dev
```

Expected: Server on :3001, Vite on :5173, Vite proxies /api to server.

**Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add dev startup with concurrently"
```

---

### Task 20: End-to-end smoke test

**Step 1: Start the app**

```bash
npm run dev
```

**Step 2: Manual verification checklist**

- [ ] Landing page loads at localhost:5173
- [ ] Register a new user
- [ ] Login with the user
- [ ] Create a pet profile
- [ ] Browse pets list
- [ ] View pet detail
- [ ] Run breed detection tool
- [ ] Run vet advisor on a pet
- [ ] Use the translator
- [ ] Genkit Dev UI works at `npm run mcp`

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: PetPawSphere full platform - MVP complete"
```

---

## Summary

| Phase | Tasks | What's Built |
|-------|-------|-------------|
| 1 | 1-3 | Monorepo + Drizzle schema + seed + DB tests |
| 2 | 4-8 | Express API (auth, pets, matches, messages, AI tools, contracts, resources) |
| 3 | 9-16 | React frontend (13 pages, auth, i18n, shadcn/ui) |
| 4 | 17-18 | Flow tests + vitest config |
| 5 | 19-20 | Dev scripts + smoke test |

**Total: 20 tasks across 5 phases.**
