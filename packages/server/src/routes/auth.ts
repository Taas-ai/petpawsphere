import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { users, PetPawSphereDb } from '@petpawsphere/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../utils/user';

export function authRouter(db: PetPawSphereDb): Router {
  const router = Router();

  // Called after Firebase sign-in to upsert user in Supabase
  // Body: { email, name, emirate?, phone?, role? }
  router.post('/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { email, name, emirate, phone, role } = req.body;
      const uid = req.userId!;

      const existing = await db.select().from(users).where(eq(users.id, uid));

      if (existing.length > 0) {
        await db.update(users).set({
          ...(name && { name }),
          ...(emirate !== undefined && { emirate }),
          ...(phone !== undefined && { phone }),
          ...(role && { role }),
          ...(email && { email }),
        }).where(eq(users.id, uid));
        const updated = await db.select().from(users).where(eq(users.id, uid));
        res.json(sanitizeUser(updated[0]));
      } else {
        if (!email || !name) {
          res.status(400).json({ error: 'email and name are required for new users' });
          return;
        }
        const now = new Date().toISOString();
        await db.insert(users).values({
          id: uid,
          email,
          name,
          emirate: emirate ?? null,
          phone: phone ?? null,
          role: role ?? 'owner',
          kycVerified: 0 as any,
          createdAt: now,
          updatedAt: now,
        });
        const created = await db.select().from(users).where(eq(users.id, uid));
        res.status(201).json(sanitizeUser(created[0]));
      }
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ error: 'User sync failed' });
    }
  });

  router.get('/me', requireAuth, async (req: AuthRequest, res) => {
    const result = await db.select().from(users).where(eq(users.id, req.userId!));
    const user = result[0];
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(sanitizeUser(user));
  });

  return router;
}
