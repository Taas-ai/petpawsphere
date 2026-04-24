import { initSentry, Sentry } from './lib/sentry';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createDb, type PetPawSphereDb } from '@petpawsphere/db';
import { authRouter } from './routes/auth';
import { petsRouter } from './routes/pets';
import { matchesRouter } from './routes/matches';
import { messagesRouter } from './routes/messages';
import { aiToolsRouter } from './routes/ai-tools';
import { contractsRouter } from './routes/contracts';
import { resourcesRouter } from './routes/resources';
import { diagnosticsRouter } from './routes/diagnostics';

export function createApp(dbOrUrl: string | PetPawSphereDb = process.env.DATABASE_URL || '') {
  initSentry();
  const db = typeof dbOrUrl === 'string' ? createDb(dbOrUrl) : dbOrUrl;
  const app = express();

  app.use(helmet());

  if (process.env['NODE_ENV'] === 'production' && !process.env['ALLOWED_ORIGINS']) {
    console.warn('[Security] ALLOWED_ORIGINS is not set in production — CORS will block all browser requests');
  }
  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3001',
    'capacitor://localhost',
    'http://localhost',
  ];
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, supertest, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // General API rate limit
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });

  // Strict rate limit for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later' },
  });

  // AI endpoint rate limit (cost protection)
  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI request limit reached, please try again later' },
  });

  // Message spam protection
  const messageLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many messages, please slow down' },
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);

  app.use('/api/auth', authRouter(db));
  app.use('/api/pets', petsRouter(db));
  app.use('/api/matches', matchesRouter(db));
  app.use('/api/messages', messageLimiter, messagesRouter(db));
  app.use('/api/resources', resourcesRouter());
  app.use('/api', aiLimiter, diagnosticsRouter(db));
  app.use('/api', aiLimiter, aiToolsRouter(db));
  app.use('/api/contracts', contractsRouter(db));

  Sentry.setupExpressErrorHandler(app);

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3001;
  const app = createApp(process.env.DATABASE_URL);
  app.listen(port, () => console.log(`PetPawSphere API running on http://localhost:${port}`));
}
