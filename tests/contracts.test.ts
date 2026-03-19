import request from 'supertest';
import app from '../src/server';
import { setupDB, teardownDB, clearDB } from './helpers/db';
import { createContractFixtures } from './fixtures/contracts';
import Contract from '../src/models/Contract';

beforeAll(() => setupDB());
afterAll(() => teardownDB());
afterEach(() => clearDB());

describe('GET /contracts/:id', () => {
  test('client can view their contract', async () => {
    const { client, contract } = await createContractFixtures();
    const res = await request(app)
      .get(`/contracts/${contract._id}`)
      .set('profile_id', client._id.toString());
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(contract._id.toString());
  });

  test('contractor can view their contract', async () => {
    const { contractor, contract } = await createContractFixtures();
    const res = await request(app)
      .get(`/contracts/${contract._id}`)
      .set('profile_id', contractor._id.toString());
    expect(res.status).toBe(200);
  });

  test('stranger cannot view the contract', async () => {
    const { stranger, contract } = await createContractFixtures();
    const res = await request(app)
      .get(`/contracts/${contract._id}`)
      .set('profile_id', stranger._id.toString());
    expect(res.status).toBe(403);
  });

  test('returns 401 when profile_id header is missing', async () => {
    const { contract } = await createContractFixtures();
    const res = await request(app).get(`/contracts/${contract._id}`);
    expect(res.status).toBe(401);
  });

  test('returns 404 for a non-existent contract', async () => {
    const { client } = await createContractFixtures();
    const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1';
    const res = await request(app)
      .get(`/contracts/${fakeId}`)
      .set('profile_id', client._id.toString());
    expect(res.status).toBe(404);
  });
});

describe('GET /contracts', () => {
  test('returns only non-terminated contracts for the profile', async () => {
    const { client, contractor, contract } = await createContractFixtures();

    const terminated = await Contract.create({
      terms: 'Old deal', status: 'terminated',
      clientId: client._id, contractorId: contractor._id,
    });

    const res = await request(app)
      .get('/contracts')
      .set('profile_id', client._id.toString());

    expect(res.status).toBe(200);
    const ids: string[] = res.body.map((c: { _id: string }) => c._id);
    expect(ids).toContain(contract._id.toString());
    expect(ids).not.toContain(terminated._id.toString());
  });

  test('contractor sees their own active contracts', async () => {
    const { contractor } = await createContractFixtures();
    const res = await request(app)
      .get('/contracts')
      .set('profile_id', contractor._id.toString());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
