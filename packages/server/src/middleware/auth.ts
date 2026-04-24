import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // In Firebase Functions the SDK auto-initializes from the environment.
  // For local dev, FIREBASE_PROJECT_ID must be set in .env.
  const projectId = process.env['FIREBASE_PROJECT_ID'];
  admin.initializeApp(projectId ? { projectId } : undefined);
}

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid token' });
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7));
    req.userId = decoded.uid;
    next();
  } catch (err) {
    console.error('[Auth] verifyIdToken failed:', err instanceof Error ? err.message : err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
