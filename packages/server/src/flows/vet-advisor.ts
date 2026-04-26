import { z } from 'genkit/beta';
import { ai } from '../genkit';

/**
 * AI Veterinary Breeding Advisor.
 * Provides pre-breeding health guidance and breeding timeline recommendations.
 */
export const vetAdvisorFlow = ai.defineFlow(
  {
    name: 'vetAdvisor',
    inputSchema: z.object({
      species: z.enum(['dog', 'cat']),
      breed: z.string(),
      age: z.number(),
      gender: z.enum(['male', 'female']),
      weight: z.number(),
      healthHistory: z.array(z.string()).optional(),
      previousLitters: z.number().default(0),
      lastHeatDate: z.string().optional().describe('ISO date of last heat cycle'),
      question: z.string().optional().describe('Specific breeding question from the owner'),
    }),
    outputSchema: z.object({
      breedingReadiness: z.enum(['ready', 'not yet', 'consult vet first', 'not recommended']),
      requiredTests: z.array(z.object({
        test: z.string(),
        reason: z.string(),
        estimatedCostAED: z.string(),
      })),
      optimalBreedingWindow: z.string().optional(),
      breedSpecificRisks: z.array(z.string()),
      uaeClimateConsiderations: z.array(z.string()),
      recommendedVetVisitBefore: z.boolean(),
      generalAdvice: z.string(),
      answerToQuestion: z.string().optional(),
    }),
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are a veterinary breeding advisor for PetPawSphere.

**Pet Details:**
- Species: ${input.species}
- Breed: ${input.breed}
- Age: ${input.age} years
- Gender: ${input.gender}
- Weight: ${input.weight} kg
- Health history: ${input.healthHistory?.join(', ') || 'None reported'}
- Previous litters: ${input.previousLitters}
- Last heat date: ${input.lastHeatDate || 'Unknown'}

${input.question ? `**Owner's Question:** ${input.question}` : ''}

Provide:
1. Breeding readiness assessment
2. Required pre-breeding tests (with estimated costs in AED for UAE clinics)
3. Optimal breeding window (if applicable)
4. Breed-specific risks
5. UAE climate considerations (heat stress, outdoor breeding timing)
6. Whether a vet visit is recommended before breeding
7. General advice

Important: Always recommend consulting a licensed UAE veterinarian for final decisions.
Consider UAE-specific factors like summer heat (40°C+) and available testing facilities.`,
      output: {
        schema: z.object({
          breedingReadiness: z.enum(['ready', 'not yet', 'consult vet first', 'not recommended']),
          requiredTests: z.array(z.object({
            test: z.string(),
            reason: z.string(),
            estimatedCostAED: z.string(),
          })),
          optimalBreedingWindow: z.string().optional(),
          breedSpecificRisks: z.array(z.string()),
          uaeClimateConsiderations: z.array(z.string()),
          recommendedVetVisitBefore: z.boolean(),
          generalAdvice: z.string(),
          answerToQuestion: z.string().optional(),
        }),
      },
    });

    return output!;
  }
);
