import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { pets, vetConsultations, PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { breedDetectFlow } from '../flows/breed-detect';
import { translateFlow } from '../flows/translate';
import { profileReviewFlow } from '../flows/profile-review';
import { vetAdvisorFlow } from '../flows/vet-advisor';
import { validateImageUrl } from '../utils/validate-url';

export function aiToolsRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  // POST /breed-detect
  router.post('/breed-detect', async (req: AuthRequest, res) => {
    try {
      if (req.body.imageUrl) {
        const urlCheck = validateImageUrl(req.body.imageUrl);
        if (!urlCheck.valid) {
          res.status(400).json({ error: urlCheck.error });
          return;
        }
      }
      const result = await breedDetectFlow(req.body);
      res.json(result);
    } catch (err: any) {
      console.error('Breed detection error:', err);
      res.status(500).json({ error: 'Breed detection failed' });
    }
  });

  // POST /translate
  router.post('/translate', async (req: AuthRequest, res) => {
    try {
      const result = await translateFlow(req.body);
      res.json(result);
    } catch (err: any) {
      console.error('Translation error:', err);
      res.status(500).json({ error: 'Translation failed' });
    }
  });

  // POST /profile-review/:petId
  router.post('/profile-review/:petId', async (req: AuthRequest, res) => {
    try {
      const [pet] = await db.select().from(pets).where(eq(pets.id, req.params.petId));
      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.ownerId !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const profile = {
        name: pet.name, species: pet.species as 'dog' | 'cat', breed: pet.breed,
        age: pet.age, gender: pet.gender as 'male' | 'female', weight: pet.weight,
        location: pet.location,
        healthRecords: JSON.parse(pet.healthRecords || '[]') as string[],
        dnaTestResults: pet.dnaTestResults ?? undefined,
        temperament: pet.temperament ?? undefined,
        pedigree: pet.pedigree ?? undefined,
        isNeutered: pet.isNeutered,
      };

      const photoUrls = JSON.parse(pet.photoUrls || '[]') as string[];
      const result = await profileReviewFlow({ profile, photoCount: photoUrls.length, hasVerifiedOwner: false, accountAge: 0 });
      res.json(result);
    } catch (err: any) {
      console.error('Profile review error:', err);
      res.status(500).json({ error: 'Profile review failed' });
    }
  });

  // POST /vet-advisor/:petId
  router.post('/vet-advisor/:petId', async (req: AuthRequest, res) => {
    try {
      const [pet] = await db.select().from(pets).where(eq(pets.id, req.params.petId));
      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.ownerId !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const result = await vetAdvisorFlow({
        species: pet.species as 'dog' | 'cat', breed: pet.breed, age: pet.age,
        gender: pet.gender as 'male' | 'female', weight: pet.weight,
        healthHistory: JSON.parse(pet.healthRecords || '[]') as string[],
        question: req.body.question,
      });

      const id = uuid();
      await db.insert(vetConsultations).values({
        id, petId: pet.id, requestedBy: req.userId!,
        breedingReadiness: result.breedingReadiness,
        requiredTests: JSON.stringify(result.requiredTests),
        breedSpecificRisks: JSON.stringify(result.breedSpecificRisks),
        uaeClimateConsiderations: JSON.stringify(result.uaeClimateConsiderations),
        generalAdvice: result.generalAdvice,
        createdAt: new Date().toISOString(),
      });

      res.json({ id, ...result });
    } catch (err: any) {
      console.error('Vet advisor error:', err);
      res.status(500).json({ error: 'Vet advisor failed' });
    }
  });

  return router;
}
