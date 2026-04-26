import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { pets, matches, breedingContracts, PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export function contractsRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  const VALID_CONTRACT_STATUSES = ['pending', 'signed', 'active', 'completed', 'cancelled'];

  // POST / — Create contract from a match
  router.post('/', async (req: AuthRequest, res) => {
    const { matchId, studFeeAED, terms } = req.body;
    if (!matchId) {
      res.status(400).json({ error: 'matchId is required' });
      return;
    }
    if (terms != null && (typeof terms !== 'string' || terms.length > 5000)) {
      res.status(400).json({ error: 'Terms must be a string ≤5000 characters' });
      return;
    }

    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const [[petA], [petB]] = await Promise.all([
      db.select().from(pets).where(eq(pets.id, match.petAId)),
      db.select().from(pets).where(eq(pets.id, match.petBId)),
    ]);

    if (!petA || !petB) {
      res.status(404).json({ error: 'Pets in match not found' });
      return;
    }

    if (petA.ownerId !== req.userId && petB.ownerId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const id = uuid();
    const now = new Date().toISOString();
    const newContract = {
      id, matchId,
      ownerAId: petA.ownerId,
      ownerBId: petB.ownerId,
      studFeeAED: studFeeAED ?? null,
      terms: terms ?? null,
      status: 'pending',
      createdAt: now, updatedAt: now,
    };
    await db.insert(breedingContracts).values(newContract);
    res.status(201).json(newContract);
  });

  // GET /:id — Get contract
  router.get('/:id', async (req: AuthRequest, res) => {
    const [contract] = await db.select().from(breedingContracts).where(eq(breedingContracts.id, req.params.id));
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    if (contract.ownerAId !== req.userId && contract.ownerBId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    res.json(contract);
  });

  // PUT /:id — Update contract status
  router.put('/:id', async (req: AuthRequest, res) => {
    const { status } = req.body;
    if (!status || !VALID_CONTRACT_STATUSES.includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${VALID_CONTRACT_STATUSES.join(', ')}` });
      return;
    }

    const [contract] = await db.select().from(breedingContracts).where(eq(breedingContracts.id, req.params.id));
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    if (contract.ownerAId !== req.userId && contract.ownerBId !== req.userId) {
      res.status(403).json({ error: 'Only contract parties can update' });
      return;
    }

    const updatedAt = new Date().toISOString();
    await db.update(breedingContracts).set({ status, updatedAt }).where(eq(breedingContracts.id, req.params.id));
    res.json({ ...contract, status, updatedAt });
  });

  return router;
}
