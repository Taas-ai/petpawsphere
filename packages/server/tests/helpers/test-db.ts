import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { PetPawSphereDb } from '@petpawsphere/db';

/**
 * Creates an in-memory SQLite database for tests.
 * Schema mirrors the PostgreSQL schema (enums as TEXT, booleans as INTEGER).
 *
 * Use with createApp(createTestDb()) to inject the DB into the Express app.
 */
export function createTestDb(): PetPawSphereDb {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      emirate TEXT,
      role TEXT NOT NULL DEFAULT 'owner',
      kyc_verified INTEGER NOT NULL DEFAULT 0,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE pets (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT NOT NULL,
      age REAL NOT NULL,
      gender TEXT NOT NULL,
      weight REAL NOT NULL,
      location TEXT NOT NULL,
      temperament TEXT,
      pedigree TEXT,
      health_records TEXT NOT NULL DEFAULT '[]',
      dna_test_results TEXT,
      is_neutered INTEGER NOT NULL DEFAULT 0,
      photo_urls TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE matches (
      id TEXT PRIMARY KEY,
      pet_a_id TEXT NOT NULL REFERENCES pets(id),
      pet_b_id TEXT NOT NULL REFERENCES pets(id),
      requested_by TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      compatibility_score REAL,
      genetic_health_risk TEXT,
      breed_compatibility TEXT,
      temperament_match TEXT,
      location_proximity TEXT,
      recommendation TEXT,
      warnings TEXT NOT NULL DEFAULT '[]',
      breeding_tips TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES matches(id),
      sender_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE breeding_contracts (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES matches(id),
      owner_a_id TEXT NOT NULL REFERENCES users(id),
      owner_b_id TEXT NOT NULL REFERENCES users(id),
      stud_fee_aed REAL,
      terms TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      contract_text TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE vet_consultations (
      id TEXT PRIMARY KEY,
      pet_id TEXT NOT NULL REFERENCES pets(id),
      requested_by TEXT NOT NULL REFERENCES users(id),
      breeding_readiness TEXT,
      required_tests TEXT NOT NULL DEFAULT '[]',
      breed_specific_risks TEXT NOT NULL DEFAULT '[]',
      uae_climate_considerations TEXT NOT NULL DEFAULT '[]',
      general_advice TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE pet_diagnostics (
      id TEXT PRIMARY KEY,
      pet_id TEXT NOT NULL REFERENCES pets(id),
      requested_by TEXT NOT NULL REFERENCES users(id),
      image_url TEXT,
      symptoms TEXT,
      assessment TEXT,
      possible_conditions TEXT NOT NULL DEFAULT '[]',
      recommended_actions TEXT NOT NULL DEFAULT '[]',
      urgency_level TEXT,
      disclaimer TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE pet_documents (
      id TEXT PRIMARY KEY,
      pet_id TEXT NOT NULL REFERENCES pets(id),
      uploaded_by TEXT NOT NULL REFERENCES users(id),
      image_url TEXT,
      document_type TEXT NOT NULL,
      extracted_data TEXT NOT NULL DEFAULT '{}',
      raw_text TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Don't pass pgTable schema to SQLite driver — column type constructors are pg-specific.
  // Flat queries (select/insert/update/delete) work fine without the schema config.
  return drizzle(sqlite) as unknown as PetPawSphereDb;
}

/** Returns an auth token that the firebase-admin mock will accept, yielding the given uid. */
export function makeToken(uid: string): string {
  return `uid:${uid}`;
}
