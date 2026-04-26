import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { pets, PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { parsePet } from '../utils/parse-json';

export function petsRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  const VALID_SPECIES = ['dog', 'cat'];
  const VALID_GENDERS = ['male', 'female'];

  router.get('/', async (req: AuthRequest, res) => {
    const { species, breed, emirate, gender, owner } = req.query;
    if (species && !VALID_SPECIES.includes(species as string)) {
      res.status(400).json({ error: 'Invalid species' }); return;
    }
    if (gender && !VALID_GENDERS.includes(gender as string)) {
      res.status(400).json({ error: 'Invalid gender' }); return;
    }
    const conditions: any[] = [eq(pets.status, 'active')];
    if (owner === 'me') conditions.push(eq(pets.ownerId, req.userId!));
    if (species) conditions.push(eq(pets.species, species as any));
    if (breed) conditions.push(eq(pets.breed, breed as string));
    if (emirate) conditions.push(eq(pets.location, emirate as string));
    if (gender) conditions.push(eq(pets.gender, gender as any));
    const results = await db.select().from(pets).where(and(...conditions));
    res.json(results.map(p => parsePet(p as Record<string, unknown>)));
  });

  router.get('/:id', async (req: AuthRequest, res) => {
    const [pet] = await db.select().from(pets).where(eq(pets.id, req.params.id));
    if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }
    res.json(parsePet(pet as Record<string, unknown>));
  });

  router.post('/', async (req: AuthRequest, res) => {
    const { name, species: sp, breed, age, gender, weight, location, temperament, pedigree, healthRecords, dnaTestResults, isNeutered, photoUrls } = req.body;
    if (!name || !sp || !breed || age == null || !gender || weight == null || !location) {
      res.status(400).json({ error: 'Missing required fields' }); return;
    }
    if (photoUrls && (!Array.isArray(photoUrls) || photoUrls.length > 20)) {
      res.status(400).json({ error: 'Maximum 20 photo URLs allowed' }); return;
    }
    const id = uuid();
    const now = new Date().toISOString();
    await db.insert(pets).values({
      id, ownerId: req.userId!, name, species: sp, breed, age, gender, weight, location,
      temperament, pedigree, isNeutered: (isNeutered ?? false) ? 1 : 0,
      healthRecords: healthRecords ? JSON.stringify(healthRecords) : '[]',
      dnaTestResults, photoUrls: photoUrls ? JSON.stringify(photoUrls) : '[]',
      createdAt: now, updatedAt: now,
    });
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    res.status(201).json(parsePet(pet as Record<string, unknown>));
  });

  router.put('/:id', async (req: AuthRequest, res) => {
    const [pet] = await db.select().from(pets).where(eq(pets.id, req.params.id));
    if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }
    if (pet.ownerId !== req.userId) { res.status(403).json({ error: 'Not your pet' }); return; }
    const updates: Record<string, any> = {};
    for (const key of ['name', 'breed', 'age', 'gender', 'weight', 'location', 'temperament', 'pedigree', 'dnaTestResults']) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.isNeutered !== undefined) updates.isNeutered = req.body.isNeutered ? 1 : 0;
    if (req.body.healthRecords) updates.healthRecords = JSON.stringify(req.body.healthRecords);
    if (req.body.photoUrls) updates.photoUrls = JSON.stringify(req.body.photoUrls);
    updates.updatedAt = new Date().toISOString();
    await db.update(pets).set(updates).where(eq(pets.id, req.params.id));
    res.json(parsePet({ ...pet, ...updates } as Record<string, unknown>));
  });

  router.delete('/:id', async (req: AuthRequest, res) => {
    const [pet] = await db.select().from(pets).where(eq(pets.id, req.params.id));
    if (!pet) { res.status(404).json({ error: 'Pet not found' }); return; }
    if (pet.ownerId !== req.userId) { res.status(403).json({ error: 'Not your pet' }); return; }
    await db.update(pets).set({ status: 'inactive', updatedAt: new Date().toISOString() }).where(eq(pets.id, req.params.id));
    res.json({ message: 'Pet deactivated' });
  });

  return router;
}
