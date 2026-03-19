import request from 'supertest';
import app from '../src/server';
import { setupDB, teardownDB, clearDB } from './helpers/db';
import { createBalanceFixtures, createBalanceFixturesNoJobs, createContractorFixture } from './fixtures/balances';

beforeAll(() => setupDB());
afterAll(() => teardownDB());
afterEach(() => clearDB());

describe('POST /balances/deposit/:userId', () => {
  test('client can deposit within the 25% cap', async () => {
    // unpaidJob.price = 200 → max deposit = 50
    const { client } = await createBalanceFixtures(100);

    const res = await request(app)
      .post(`/balances/deposit/${client._id}`)
      .set('profile_id', client._id.toString())
      .send({ amount: 50 });

    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(150); // 100 + 50
  });

  test('rejects deposit exceeding 25% of unpaid jobs', async () => {
    // unpaidJob.price = 200 → max deposit = 50
    const { client } = await createBalanceFixtures(100);

    const res = await request(app)
      .post(`/balances/deposit/${client._id}`)
      .set('profile_id', client._id.toString())
      .send({ amount: 51 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds limit/i);
  });

  test('rejects deposit of zero or negative amount', async () => {
    const { client } = await createBalanceFixtures(100);

    const res = await request(app)
      .post(`/balances/deposit/${client._id}`)
      .set('profile_id', client._id.toString())
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  test('rejects deposit into another user account', async () => {
    const { client, contractor } = await createBalanceFixtures(100);

    const res = await request(app)
      .post(`/balances/deposit/${contractor._id}`)
      .set('profile_id', client._id.toString())
      .send({ amount: 10 });

    expect(res.status).toBe(403);
  });

  test('rejects when no unpaid jobs exist (max deposit = 0)', async () => {
    const { client } = await createBalanceFixturesNoJobs();

    const res = await request(app)
      .post(`/balances/deposit/${client._id}`)
      .set('profile_id', client._id.toString())
      .send({ amount: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds limit/i);
  });

  test('returns 401 when no profile_id header', async () => {
    const { client } = await createBalanceFixtures(100);

    const res = await request(app)
      .post(`/balances/deposit/${client._id}`)
      .send({ amount: 10 });

    expect(res.status).toBe(401);
  });

  test('returns 404 for non-existent user', async () => {
    const { client } = await createBalanceFixtures(100);
    const fakeId = '000000000000000000000001';

    const res = await request(app)
      .post(`/balances/deposit/${fakeId}`)
      .set('profile_id', client._id.toString())
      .send({ amount: 10 });

    expect(res.status).toBe(404);
  });

  test('contractor cannot deposit', async () => {
    const { contractor } = await createContractorFixture();

    const res = await request(app)
      .post(`/balances/deposit/${contractor._id}`)
      .set('profile_id', contractor._id.toString())
      .send({ amount: 10 });

    expect(res.status).toBe(403);
  });
});
