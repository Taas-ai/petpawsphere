import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq, desc } from 'drizzle-orm';
import { pets, petDiagnostics, petDocuments, PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { petDiagnosticFlow } from '../flows/pet-diagnostic';
import { vetDocumentOCRFlow } from '../flows/vet-document-ocr';
import { validateImageUrl } from '../utils/validate-url';
import { parseDiagnostic } from '../utils/parse-json';

export function diagnosticsRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  // POST /diagnostic/:petId — analyze symptom photo
  router.post('/diagnostic/:petId', async (req: AuthRequest, res) => {
    try {
      const [pet] = await db.select().from(pets).where(eq(pets.id, req.params.petId));
      if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }

      if (pet.ownerId !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { imageUrl, symptoms } = req.body;
      if (!imageUrl) { res.status(400).json({ error: 'imageUrl is required' }); return; }

      const urlCheck = validateImageUrl(imageUrl);
      if (!urlCheck.valid) {
        res.status(400).json({ error: urlCheck.error });
        return;
      }

      const result = await petDiagnosticFlow({
        imageUrl, symptoms,
        species: pet.species as 'dog' | 'cat',
        breed: pet.breed,
        age: pet.age,
      });

      const id = uuid();
      await db.insert(petDiagnostics).values({
        id, petId: pet.id, requestedBy: req.userId!,
        imageUrl, symptoms,
        assessment: result.assessment,
        possibleConditions: JSON.stringify(result.possibleConditions),
        recommendedActions: JSON.stringify(result.recommendedActions),
        urgencyLevel: result.urgencyLevel,
        disclaimer: result.disclaimer,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({ id, ...result });
    } catch (err) {
      console.error('Diagnostic error:', err);
      res.status(500).json({ error: 'Diagnostic analysis failed' });
    }
  });

  // GET /diagnostic/:petId — diagnostic history
  router.get('/diagnostic/:petId', async (req: AuthRequest, res) => {
    try {
      const [pet] = await db.select().from(pets).where(eq(pets.id, req.params.petId));
      if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }

      if (pet.ownerId !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const results = await db.select().from(petDiagnostics)
        .where(eq(petDiagnostics.petId, req.params.petId))
        .orderBy(desc(petDiagnostics.createdAt));
      res.json(results.map(d => parseDiagnostic(d as Record<string, unknown>)));
    } catch (err) {
      console.error('Diagnostic history error:', err);
      res.status(500).json({ error: 'Failed to fetch diagnostics' });
    }
  });

  // POST /documents/:petId/scan — OCR vet document
  router.post('/documents/:petId/scan', async (req: AuthRequest, res) => {
    try {
      const [pet] = await db.select().from(pets).where(eq(pets.id, req.params.petId));
      if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }

      if (pet.ownerId !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { imageUrl, documentType } = req.body;
      if (!imageUrl || !documentType) {
        res.status(400).json({ error: 'imageUrl and documentType are required' });
        return;
      }

      const urlCheck = validateImageUrl(imageUrl);
      if (!urlCheck.valid) {
        res.status(400).json({ error: urlCheck.error });
        return;
      }

      const result = await vetDocumentOCRFlow({ imageUrl, documentType });

      const id = uuid();
      await db.insert(petDocuments).values({
        id, petId: pet.id, uploadedBy: req.userId!,
        imageUrl, documentType,
        extractedData: JSON.stringify(result),
        rawText: result.rawText,
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({ id, ...result });
    } catch (err) {
      console.error('Document OCR error:', err);
      res.status(500).json({ error: 'Document scanning failed' });
    }
  });

  // GET /documents/:petId — document history
  router.get('/documents/:petId', async (req: AuthRequest, res) => {
    try {
      const [pet] = await db.select().from(pets).where(eq(pets.id, req.params.petId));
      if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }

      if (pet.ownerId !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const results = await db.select().from(petDocuments)
        .where(eq(petDocuments.petId, req.params.petId))
        .orderBy(desc(petDocuments.createdAt));
      res.json(results);
    } catch (err) {
      console.error('Document history error:', err);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  return router;
}
