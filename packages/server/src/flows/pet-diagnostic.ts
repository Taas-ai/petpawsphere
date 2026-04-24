import { z } from 'genkit/beta';
import { ai } from '../genkit';

const DiagnosticResultSchema = z.object({
  assessment: z.string(),
  possibleConditions: z.array(z.object({
    condition: z.string(),
    likelihood: z.enum(['high', 'moderate', 'low']),
    severity: z.enum(['mild', 'moderate', 'severe']),
    description: z.string(),
  })),
  recommendedActions: z.array(z.string()),
  urgencyLevel: z.enum(['routine', 'soon', 'urgent', 'emergency']),
  shouldSeeVet: z.boolean(),
  disclaimer: z.string(),
});

export const petDiagnosticFlow = ai.defineFlow(
  {
    name: 'petDiagnostic',
    inputSchema: z.object({
      imageUrl: z.string().describe('Photo of the pet symptom'),
      symptoms: z.string().optional().describe('User-described symptoms'),
      species: z.enum(['dog', 'cat']),
      breed: z.string(),
      age: z.number(),
    }),
    outputSchema: DiagnosticResultSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: [
        { media: { url: input.imageUrl } },
        {
          text: `You are a veterinary diagnostic assistant for PetPawSphere.

Analyze this photo of a ${input.species} (${input.breed}, ${input.age} years old).
${input.symptoms ? `Owner reports: "${input.symptoms}"` : 'No symptoms described by owner.'}

Provide:
1. Assessment summary
2. Possible conditions with likelihood and severity
3. Recommended actions (specific steps the owner should take)
4. Urgency level: routine (can wait for regular appointment), soon (within a few days), urgent (within 24 hours), emergency (immediately)
5. Whether they should see a vet

IMPORTANT:
- Always include a disclaimer that this is NOT a veterinary diagnosis
- Always recommend consulting a licensed UAE veterinarian
- Consider UAE climate factors (heat stress, dehydration, desert parasites)
- Be cautious — when in doubt, recommend a vet visit
- Never suggest specific medications or dosages`,
        },
      ],
      output: { schema: DiagnosticResultSchema },
    });

    return output!;
  }
);
