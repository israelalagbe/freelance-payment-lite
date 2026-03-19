import request from 'supertest';
import app from '../src/server';
import { setupDB, teardownDB, clearDB } from './helpers/db';
import { createAdminFixtures } from './fixtures/admin';

beforeAll(() => setupDB());
afterAll(() => teardownDB());
afterEach(() => clearDB());

const withinRange = '2025-01-15';
const start = '2025-01-01';
const end = '2025-01-31';
const outsideRange = '2024-12-01';

describe('GET /admin/best-profession', () => {
  test('returns the profession with highest total earnings in range', async () => {
    await createAdminFixtures(new Date(withinRange));

    const res = await request(app)
      .get('/admin/best-profession')
      .query({ start, end });

    expect(res.status).toBe(200);
    expect(res.body.profession).toBe('Programmer');
    expect(res.body.totalEarned).toBe(500);
  });

  test('returns 404 when no paid jobs exist in range', async () => {
    await createAdminFixtures(new Date(outsideRange));

    const res = await request(app)
      .get('/admin/best-profession')
      .query({ start, end });

    expect(res.status).toBe(404);
  });

  test('returns 400 when date params are missing', async () => {
    const res = await request(app).get('/admin/best-profession');

    expect(res.status).toBe(400);
  });

  test('returns 400 when date params are invalid', async () => {
    const res = await request(app)
      .get('/admin/best-profession')
      .query({ start: 'not-a-date', end });

    expect(res.status).toBe(400);
  });
});

describe('GET /admin/best-clients', () => {
  test('returns top 2 clients by amount paid (default limit)', async () => {
    await createAdminFixtures(new Date(withinRange));

    const res = await request(app)
      .get('/admin/best-clients')
      .query({ start, end });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].fullName).toBe('Alice Alpha');
    expect(res.body[0].paid).toBe(450);
    expect(res.body[1].fullName).toBe('Bob Beta');
    expect(res.body[1].paid).toBe(200);
  });

  test('respects the limit param', async () => {
    await createAdminFixtures(new Date(withinRange));

    const res = await request(app)
      .get('/admin/best-clients')
      .query({ start, end, limit: '1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].fullName).toBe('Alice Alpha');
  });

  test('returns empty array when no paid jobs exist in range', async () => {
    await createAdminFixtures(new Date(outsideRange));

    const res = await request(app)
      .get('/admin/best-clients')
      .query({ start, end });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns 400 when date params are missing', async () => {
    const res = await request(app).get('/admin/best-clients');

    expect(res.status).toBe(400);
  });

  test('returns 400 when limit is not a positive integer', async () => {
    const res = await request(app)
      .get('/admin/best-clients')
      .query({ start, end, limit: '0' });

    expect(res.status).toBe(400);
  });
});

describe('Rate limiting', () => {
  test('returns 429 after 30 analytics requests in the same window', async () => {
    await createAdminFixtures(new Date(withinRange));

    // Fire 30 requests — all should succeed (or 404, but not 429).
    for (let i = 0; i < 30; i++) {
      await request(app).get('/admin/best-profession').query({ start, end });
    }

    // The 31st request should be rate-limited.
    const res = await request(app)
      .get('/admin/best-profession')
      .query({ start, end });

    expect(res.status).toBe(429);
  });
});
