import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api-server';
import { createTestDb, makeToken } from '../helpers/test-db';

const UID = 'test-owner-001';

async function setupUser(app: any) {
  await request(app).post('/api/auth/sync')
    .set('Authorization', `Bearer ${makeToken(UID)}`)
    .send({ email: 'u@example.com', name: 'Original Name', emirate: 'Dubai' });
}

describe('PATCH /api/auth/me', () => {
  let app: any;

  beforeEach(async () => {
    const db = createTestDb();
    app = createApp(db);
    await setupUser(app);
  });

  it('updates name, phone, and emirate', async () => {
    const res = await request(app).patch('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken(UID)}`)
      .send({ name: 'New Name', phone: '+971500000000', emirate: 'Abu Dhabi' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.phone).toBe('+971500000000');
    expect(res.body.emirate).toBe('Abu Dhabi');
  });

  it('rejects forbidden field: email', async () => {
    const res = await request(app).patch('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken(UID)}`)
      .send({ email: 'hacker@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects forbidden field: role', async () => {
    const res = await request(app).patch('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken(UID)}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('rejects forbidden field: kycVerified', async () => {
    const res = await request(app).patch('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken(UID)}`)
      .send({ kycVerified: true });
    expect(res.status).toBe(400);
  });

  it('rejects forbidden field: id', async () => {
    const res = await request(app).patch('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken(UID)}`)
      .send({ id: 'other-user-id' });
    expect(res.status).toBe(400);
  });

  it('accepts empty body as no-op', async () => {
    const res = await request(app).patch('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken(UID)}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.name).toBeDefined();
  });
});
