import { createMcpServer } from '@genkit-ai/mcp';
import { z } from 'genkit/beta';
import { ai, PetProfileSchema, MatchResultSchema } from './genkit';

// Import all flows (registers them with the Genkit instance)
import './flows/pet-match';
import './flows/breed-detect';
import './flows/translate';
import './flows/profile-review';
import './flows/vet-advisor';

// ─────────────────────────────────────────────
// MCP TOOLS — Expose flows as callable tools
// ─────────────────────────────────────────────

ai.defineTool(
  {
    name: 'petpawsphere_match_pets',
    description:
      'Analyze compatibility between two pets for breeding. Returns compatibility score, genetic health risk, temperament match, and breeding recommendations for the UAE market.',
    inputSchema: z.object({
      petA: PetProfileSchema,
      petB: PetProfileSchema,
    }),
    outputSchema: MatchResultSchema,
  },
  async (input) => {
    const { petMatchFlow } = await import('./flows/pet-match');
    return petMatchFlow(input);
  }
);

ai.defineTool(
  {
    name: 'petpawsphere_detect_breed',
    description:
      'Detect pet breed from an image URL or text description. Returns breed info, UAE popularity, heat tolerance, and estimated price in AED.',
    inputSchema: z.object({
      imageUrl: z.string().optional().describe('URL of the pet photo'),
      description: z.string().optional().describe('Text description if no image'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const { breedDetectFlow } = await import('./flows/breed-detect');
    return breedDetectFlow(input);
  }
);

ai.defineTool(
  {
    name: 'petpawsphere_translate',
    description:
      'Translate text between Arabic and English with pet breeding terminology. Uses Gulf Arabic dialect.',
    inputSchema: z.object({
      text: z.string(),
      targetLanguage: z.enum(['arabic', 'english']),
      context: z.enum(['profile', 'chat', 'medical', 'legal']).optional(),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const { translateFlow } = await import('./flows/translate');
    return translateFlow(input);
  }
);

ai.defineTool(
  {
    name: 'petpawsphere_review_profile',
    description:
      'Review a pet profile for quality, completeness, trust score, and fraud risk indicators. Determines if profile is ready for public listing.',
    inputSchema: z.object({
      profile: PetProfileSchema,
      photoCount: z.number().default(0),
      hasVerifiedOwner: z.boolean().default(false),
      accountAge: z.number().default(0).describe('Account age in days'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const { profileReviewFlow } = await import('./flows/profile-review');
    return profileReviewFlow(input);
  }
);

ai.defineTool(
  {
    name: 'petpawsphere_vet_advisor',
    description:
      'Get veterinary breeding advice for a pet. Returns breeding readiness, required tests with UAE costs, breed-specific risks, and climate considerations.',
    inputSchema: z.object({
      species: z.enum(['dog', 'cat']),
      breed: z.string(),
      age: z.number(),
      gender: z.enum(['male', 'female']),
      weight: z.number(),
      healthHistory: z.array(z.string()).optional(),
      previousLitters: z.number().default(0),
      lastHeatDate: z.string().optional(),
      question: z.string().optional(),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const { vetAdvisorFlow } = await import('./flows/vet-advisor');
    return vetAdvisorFlow(input);
  }
);

// ─────────────────────────────────────────────
// MCP PROMPTS — Reusable prompt templates
// ─────────────────────────────────────────────

ai.definePrompt(
  {
    name: 'petpawsphere_listing_description',
    description: 'Generate an attractive pet listing description for PetPawSphere',
    input: {
      schema: z.object({
        petName: z.string(),
        breed: z.string(),
        age: z.number(),
        gender: z.string(),
        temperament: z.string().optional(),
        achievements: z.string().optional(),
        language: z.enum(['english', 'arabic', 'bilingual']).default('english'),
      }),
    },
  },
  `You are a copywriter for PetPawSphere, the premium pet breeding platform.

Write an engaging, professional listing description for:
- Name: {{petName}}
- Breed: {{breed}}
- Age: {{age}} years
- Gender: {{gender}}
{{#if temperament}}- Temperament: {{temperament}}{{/if}}
{{#if achievements}}- Achievements: {{achievements}}{{/if}}

Language: {{language}}
{{#if (eq language "bilingual")}}Provide both English and Arabic versions.{{/if}}

Keep it warm, professional, and highlight breeding qualities. Include relevant emojis.
Mention health verification status if applicable. Target UAE pet owners.`
);

ai.definePrompt(
  {
    name: 'petpawsphere_breeding_contract',
    description: 'Generate a breeding agreement outline for two pet owners in the UAE',
    input: {
      schema: z.object({
        ownerA: z.string(),
        ownerB: z.string(),
        petA: z.string(),
        petB: z.string(),
        breed: z.string(),
        studFee: z.string().optional(),
        terms: z.string().optional(),
      }),
    },
  },
  `Generate a professional breeding agreement outline for PetPawSphere.

Parties:
- Owner A: {{ownerA}} (Pet: {{petA}})
- Owner B: {{ownerB}} (Pet: {{petB}})
- Breed: {{breed}}
{{#if studFee}}- Stud Fee: {{studFee}} AED{{/if}}
{{#if terms}}- Special Terms: {{terms}}{{/if}}

Include standard sections: responsibilities, health warranties, litter arrangements,
payment terms, dispute resolution (UAE law), and cancellation policy.
Note: This is an outline only — recommend legal review before signing.`
);

// ─────────────────────────────────────────────
// MCP RESOURCES — Static reference data
// ─────────────────────────────────────────────

ai.defineResource(
  {
    name: 'UAE Popular Breeds',
    uri: 'petpawsphere://breeds/uae-popular',
  },
  async () => ({
    content: [
      {
        text: JSON.stringify({
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
        }, null, 2),
      },
    ],
  })
);

ai.defineResource(
  {
    name: 'UAE Vet Clinics',
    uri: 'petpawsphere://vets/uae-directory',
  },
  async () => ({
    content: [
      {
        text: JSON.stringify({
          note: 'Sample directory — integrate with real API in production',
          clinics: [
            { name: 'Modern Vet', location: 'Dubai', services: ['DNA Testing', 'Pre-breeding checks', 'AI insemination'], area: 'Jumeirah' },
            { name: 'British Veterinary Hospital', location: 'Abu Dhabi', services: ['Genetic screening', 'Breeding consultation'], area: 'Khalifa City' },
            { name: 'Canadian Veterinary Clinic', location: 'Dubai', services: ['Breed certification', 'Health checks'], area: 'Umm Suqeim' },
            { name: 'Abu Dhabi Falcon Hospital', location: 'Abu Dhabi', services: ['Exotic breeds', 'Raptor breeding'], area: 'Sweihan' },
          ],
        }, null, 2),
      },
    ],
  })
);

// ─────────────────────────────────────────────
// START MCP SERVER
// ─────────────────────────────────────────────

const server = createMcpServer(ai, {
  name: 'petpawsphere',
  version: '1.0.0',
});

server.setup().then(() => server.start());
