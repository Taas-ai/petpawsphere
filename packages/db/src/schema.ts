import { pgTable, pgEnum, varchar, text, real, boolean, timestamp as pgTimestamp } from 'drizzle-orm/pg-core';

// Use string mode so timestamps round-trip as ISO strings in both PostgreSQL and SQLite tests
const timestamp = (name: string) => pgTimestamp(name, { mode: 'string' });

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum('role', ['owner', 'breeder', 'vet', 'admin']);
export const speciesEnum = pgEnum('species', ['dog', 'cat']);
export const genderEnum = pgEnum('gender', ['male', 'female']);
export const petStatusEnum = pgEnum('pet_status', ['active', 'inactive', 'suspended']);
export const matchStatusEnum = pgEnum('match_status', ['pending', 'accepted', 'rejected', 'completed']);
export const contractStatusEnum = pgEnum('contract_status', ['draft', 'active', 'completed', 'disputed']);
export const urgencyLevelEnum = pgEnum('urgency_level', ['routine', 'soon', 'urgent', 'emergency']);
export const documentTypeEnum = pgEnum('document_type', ['lab_report', 'prescription', 'vaccination']);

// ─── Tables ───────────────────────────────────────────────────────────────────

// id = Firebase UID (string, up to 128 chars)
export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  emirate: text('emirate'),
  role: roleEnum('role').notNull().default('owner'),
  kycVerified: boolean('kyc_verified').notNull().default(false),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pets = pgTable('pets', {
  id: text('id').primaryKey(),
  ownerId: varchar('owner_id', { length: 128 }).notNull().references(() => users.id),
  name: text('name').notNull(),
  species: speciesEnum('species').notNull(),
  breed: text('breed').notNull(),
  age: real('age').notNull(),
  gender: genderEnum('gender').notNull(),
  weight: real('weight').notNull(),
  location: text('location').notNull(),
  temperament: text('temperament'),
  pedigree: text('pedigree'),
  healthRecords: text('health_records').notNull().default('[]'),
  dnaTestResults: text('dna_test_results'),
  isNeutered: boolean('is_neutered').notNull().default(false),
  photoUrls: text('photo_urls').notNull().default('[]'),
  status: petStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const matches = pgTable('matches', {
  id: text('id').primaryKey(),
  petAId: text('pet_a_id').notNull().references(() => pets.id),
  petBId: text('pet_b_id').notNull().references(() => pets.id),
  requestedBy: varchar('requested_by', { length: 128 }).notNull().references(() => users.id),
  status: matchStatusEnum('status').notNull().default('pending'),
  compatibilityScore: real('compatibility_score'),
  geneticHealthRisk: text('genetic_health_risk'),
  breedCompatibility: text('breed_compatibility'),
  temperamentMatch: text('temperament_match'),
  locationProximity: text('location_proximity'),
  recommendation: text('recommendation'),
  warnings: text('warnings').notNull().default('[]'),
  breedingTips: text('breeding_tips').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id),
  senderId: varchar('sender_id', { length: 128 }).notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const breedingContracts = pgTable('breeding_contracts', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id),
  ownerAId: varchar('owner_a_id', { length: 128 }).notNull().references(() => users.id),
  ownerBId: varchar('owner_b_id', { length: 128 }).notNull().references(() => users.id),
  studFeeAED: real('stud_fee_aed'),
  terms: text('terms'),
  status: contractStatusEnum('status').notNull().default('draft'),
  contractText: text('contract_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vetConsultations = pgTable('vet_consultations', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id),
  requestedBy: varchar('requested_by', { length: 128 }).notNull().references(() => users.id),
  breedingReadiness: text('breeding_readiness'),
  requiredTests: text('required_tests').notNull().default('[]'),
  breedSpecificRisks: text('breed_specific_risks').notNull().default('[]'),
  uaeClimateConsiderations: text('uae_climate_considerations').notNull().default('[]'),
  generalAdvice: text('general_advice'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const petDiagnostics = pgTable('pet_diagnostics', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id),
  requestedBy: varchar('requested_by', { length: 128 }).notNull().references(() => users.id),
  imageUrl: text('image_url'),
  symptoms: text('symptoms'),
  assessment: text('assessment'),
  possibleConditions: text('possible_conditions').notNull().default('[]'),
  recommendedActions: text('recommended_actions').notNull().default('[]'),
  urgencyLevel: urgencyLevelEnum('urgency_level'),
  disclaimer: text('disclaimer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const petDocuments = pgTable('pet_documents', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id),
  uploadedBy: varchar('uploaded_by', { length: 128 }).notNull().references(() => users.id),
  imageUrl: text('image_url'),
  documentType: documentTypeEnum('document_type').notNull(),
  extractedData: text('extracted_data').notNull().default('{}'),
  rawText: text('raw_text'),
  processedAt: text('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Monetization ────────────────────────────────────────────────────────────
// Dark-launched behind MONETIZATION_ENABLED flag.
// After adding, run: npm run db:generate && npm run db:migrate

export const subscriptions = pgTable('subscriptions', {
  userId: varchar('user_id', { length: 128 }).primaryKey().references(() => users.id),
  stripeCustomerId: text('stripe_customer_id').notNull().unique(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  currentPeriodEnd: timestamp('current_period_end'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const boosts = pgTable('boosts', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id),
  stripeSessionId: text('stripe_session_id').notNull().unique(),
  startsAt: timestamp('starts_at').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
