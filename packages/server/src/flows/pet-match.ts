import { z } from 'genkit/beta';
import { ai, PetProfileSchema, MatchResultSchema } from '../genkit';

/**
 * AI-Powered Pet Compatibility Matching
 * Analyzes two pet profiles and returns a detailed compatibility assessment.
 */
export const petMatchFlow = ai.defineFlow(
  {
    name: 'petMatch',
    inputSchema: z.object({
      petA: PetProfileSchema,
      petB: PetProfileSchema,
    }),
    outputSchema: MatchResultSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are a professional pet breeding compatibility assessor for PetPawSphere.

Analyze these two pets for breeding compatibility:

**Pet A:**
${JSON.stringify(input.petA, null, 2)}

**Pet B:**
${JSON.stringify(input.petB, null, 2)}

Evaluate:
1. Genetic health risk (considering breed-specific conditions, DNA test results if available)
2. Breed compatibility (same breed or complementary breeds)
3. Temperament match
4. Location proximity within UAE
5. Age and weight compatibility
6. Any red flags (neutered status, health concerns)

Provide a compatibility score (0-100), detailed recommendation, any warnings, and breeding tips.
Important: Be especially cautious about genetic conditions common in the UAE market (e.g., brachycephalic breeds in hot climate).`,
      output: { schema: MatchResultSchema },
    });

    return output!;
  }
);
