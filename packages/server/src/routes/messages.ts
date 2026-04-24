import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { pets, matches, messages, PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

async function isMatchParticipant(db: PetPawSphereDb, matchId: string, userId: string): Promise<boolean> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
  if (!match) return false;

  const [petA] = await db.select().from(pets).where(eq(pets.id, match.petAId));
  const [petB] = await db.select().from(pets).where(eq(pets.id, match.petBId));

  return (petA?.ownerId === userId) || (petB?.ownerId === userId);
}

export function messagesRouter(db: PetPawSphereDb): Router {
  const router = Router();
  router.use(requireAuth);

  // GET /:matchId — Get all messages for a match
  router.get('/:matchId', async (req: AuthRequest, res) => {
    const participant = await isMatchParticipant(db, req.params.matchId, req.userId!);
    if (!participant) {
      res.status(403).json({ error: 'Not a participant in this match' });
      return;
    }

    const msgs = await db.select().from(messages).where(eq(messages.matchId, req.params.matchId));
    res.json(msgs);
  });

  // POST /:matchId — Send a message
  router.post('/:matchId', async (req: AuthRequest, res) => {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }
    if (typeof content !== 'string' || content.length > 2000) {
      res.status(400).json({ error: 'Message must be a string of 2000 characters or fewer' });
      return;
    }

    const [match] = await db.select().from(matches).where(eq(matches.id, req.params.matchId));
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    if (match.status !== 'accepted') {
      res.status(403).json({ error: 'Can only message in accepted matches' });
      return;
    }

    const [[petA], [petB]] = await Promise.all([
      db.select({ ownerId: pets.ownerId }).from(pets).where(eq(pets.id, match.petAId)),
      db.select({ ownerId: pets.ownerId }).from(pets).where(eq(pets.id, match.petBId)),
    ]);
    if (petA?.ownerId !== req.userId && petB?.ownerId !== req.userId) {
      res.status(403).json({ error: 'Not a participant in this match' });
      return;
    }

    const id = uuid();
    await db.insert(messages).values({ id, matchId: req.params.matchId, senderId: req.userId!, content, createdAt: new Date().toISOString() });
    const [msg] = await db.select().from(messages).where(eq(messages.id, id));
    res.status(201).json(msg);
  });

  return router;
}
