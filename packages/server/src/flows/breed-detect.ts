import { z } from 'genkit/beta';
import { ai } from '../genkit';

const BreedDetectionResultSchema = z.object({
  primaryBreed: z.string(),
  confidence: z.number().min(0).max(100),
  secondaryBreed: z.string().optional(),
  species: z.enum(['dog', 'cat', 'unknown']),
  estimatedAge: z.string().optional(),
  colorPattern: z.string(),
  sizeCategory: z.enum(['toy', 'small', 'medium', 'large', 'giant', 'unknown']),
  breedCharacteristics: z.array(z.string()),
  uaePopularity: z.enum(['very popular', 'popular', 'moderate', 'rare']),
  heatToleranceRating: z.enum(['excellent', 'good', 'fair', 'poor']),
  averagePrice: z.string().describe('Estimated price range in AED'),
});

/**
 * AI Breed Detection from image URL or description.
 * Identifies breed, characteristics, and UAE-specific info.
 */
export const breedDetectFlow = ai.defineFlow(
  {
    name: 'breedDetect',
    inputSchema: z.object({
      imageUrl: z.string().optional().describe('URL of the pet photo'),
      description: z.string().optional().describe('Text description if no image'),
    }),
    outputSchema: BreedDetectionResultSchema,
  },
  async (input) => {
    const prompt = input.imageUrl
      ? [
          { media: { url: input.imageUrl } },
          {
            text: `Analyze this pet image for PetPawSphere. Identify the breed, estimate age, describe color pattern, classify size, and provide UAE-specific info (popularity, heat tolerance, price range in AED). If mixed breed, identify primary and secondary breeds.`,
          },
        ]
      : `Based on this description, identify the pet breed: "${input.description}". Provide breed characteristics, UAE popularity, heat tolerance rating, and estimated price range in AED.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: BreedDetectionResultSchema },
    });

    return output!;
  }
);
