import { genkit, z } from 'genkit/beta';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with Google AI (Gemini).
// TODO Phase 4: swap to @genkit-ai/vertexai with Firebase AI Logic billing
// once the Vertex AI integration is confirmed with Firebase project credentials.
export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

// ─────────────────────────────────────────────
// SCHEMAS — Shared Zod schemas for PetPawSphere
// ─────────────────────────────────────────────

export const PetProfileSchema = z.object({
  name: z.string(),
  species: z.enum(['dog', 'cat']),
  breed: z.string(),
  age: z.number().describe('Age in years'),
  gender: z.enum(['male', 'female']),
  weight: z.number().describe('Weight in kg'),
  location: z.string().describe('Emirate or city, e.g. Dubai, Abu Dhabi'),
  healthRecords: z.array(z.string()).optional().describe('List of health conditions or vaccinations'),
  dnaTestResults: z.string().optional().describe('DNA test summary if available'),
  temperament: z.string().optional().describe('Personality traits'),
  pedigree: z.string().optional().describe('Pedigree/lineage info'),
  isNeutered: z.boolean(),
});

export const MatchResultSchema = z.object({
  compatibilityScore: z.number().min(0).max(100),
  geneticHealthRisk: z.enum(['low', 'medium', 'high']),
  breedCompatibility: z.enum(['excellent', 'good', 'fair', 'poor']),
  temperamentMatch: z.enum(['excellent', 'good', 'fair', 'poor']),
  locationProximity: z.string(),
  recommendation: z.string(),
  warnings: z.array(z.string()),
  breedingTips: z.array(z.string()),
});
