import { z } from 'genkit/beta';
import { ai, PetProfileSchema } from '../genkit';

const ProfileReviewSchema = z.object({
  qualityScore: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  issues: z.array(z.object({
    field: z.string(),
    severity: z.enum(['critical', 'warning', 'suggestion']),
    message: z.string(),
  })),
  suggestedImprovements: z.array(z.string()),
  fraudRiskIndicators: z.array(z.string()),
  readyForListing: z.boolean(),
});

/**
 * AI-powered pet profile quality assessment and fraud detection.
 * Reviews completeness, trust signals, and fraud indicators.
 */
export const profileReviewFlow = ai.defineFlow(
  {
    name: 'profileReview',
    inputSchema: z.object({
      profile: PetProfileSchema,
      photoCount: z.number().default(0),
      hasVerifiedOwner: z.boolean().default(false),
      accountAge: z.number().default(0).describe('Account age in days'),
    }),
    outputSchema: ProfileReviewSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are PetPawSphere's profile quality and fraud detection AI.

Review this pet profile for quality, completeness, and potential fraud:

**Profile:**
${JSON.stringify(input.profile, null, 2)}

**Additional Signals:**
- Photos uploaded: ${input.photoCount}
- Owner verified (KYC): ${input.hasVerifiedOwner}
- Account age: ${input.accountAge} days

Assess:
1. Profile quality score (photos, completeness of info)
2. Completeness percentage
3. Trust score based on verification, account age, detail consistency
4. Flag any issues (missing mandatory fields, suspicious data, breed-weight mismatches)
5. Fraud risk indicators (e.g., new account with premium breed, inconsistent details)
6. Whether the profile is ready for public listing

Context: UAE pet market has significant fraud with fake breeders and stolen pet photos.`,
      output: { schema: ProfileReviewSchema },
    });

    return output!;
  }
);
