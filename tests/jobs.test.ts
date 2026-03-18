import request from 'supertest';
import app from '../src/server';
import { setupDB, teardownDB, clearDB } from './helpers/db';
import { createJobFixtures } from './fixtures/jobs';
import Profile from '../src/models/Profile';
import Contract from '../src/models/Contract';
import Job from '../src/models/Job';
import { paymentService } from '../src/container';

beforeAll(() => setupDB());
afterAll(() => teardownDB());
afterEach(() => clearDB());

describe('GET /jobs/unpaid', () => {
  test('returns unpaid jobs on in_progress contracts only', async () => {
    const { client, contractor } = await createJobFixtures();

    // Terminated contract — its job should NOT appear
    const terminated = await Contract.create({
      terms: 'Old', status: 'terminated',
      clientId: client._id, contractorId: contractor._id,
    });
    await Job.create({ description: 'Ignored', price: 50, contractId: terminated._id });

    const res = await request(app)
      .get('/jobs/unpaid')
      .set('profile_id', client._id.toString());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].description).toBe('Endpoints');
  });

  test('returns 401 without profile_id header', async () => {
    const res = await request(app).get('/jobs/unpaid');
    expect(res.status).toBe(401);
  });
});

describe('POST /jobs/:job_id/pay', () => {
  test('successfully pays a job and transfers balance', async () => {
    const { client, contractor, job } = await createJobFixtures();

    const res = await request(app)
      .post(`/jobs/${job._id}/pay`)
      .set('profile_id', client._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.paid).toBe(true);

    const [updatedClient, updatedContractor] = await Promise.all([
      Profile.findById(client._id),
      Profile.findById(contractor._id),
    ]);
    expect(updatedClient!.balance).toBe(400); // 500 - 100
    expect(updatedContractor!.balance).toBe(100);
  });

  test('prevents double payment on the same job', async () => {
    const { client, job } = await createJobFixtures();

    const first = await request(app)
      .post(`/jobs/${job._id}/pay`)
      .set('profile_id', client._id.toString());
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/jobs/${job._id}/pay`)
      .set('profile_id', client._id.toString());
    expect(second.status).toBe(400);

    const updatedClient = await Profile.findById(client._id);
    expect(updatedClient!.balance).toBe(400); // changed exactly once
  });

  test('returns 400 when client has insufficient balance', async () => {
    const { client, job } = await createJobFixtures(50);

    const res = await request(app)
      .post(`/jobs/${job._id}/pay`)
      .set('profile_id', client._id.toString());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  test('returns 403 when a non-client attempts to pay', async () => {
    const { contractor, job } = await createJobFixtures();

    const res = await request(app)
      .post(`/jobs/${job._id}/pay`)
      .set('profile_id', contractor._id.toString());

    expect(res.status).toBe(403);
  });

  test('idempotent payment: same Idempotency-Key does not double-charge', async () => {
    const { client, contractor, job } = await createJobFixtures();

    await request(app)
      .post(`/jobs/${job._id}/pay`)
      .set('profile_id', client._id.toString())
      .set('idempotency-key', 'ref-abc-123');

    const retry = await request(app)
      .post(`/jobs/${job._id}/pay`)
      .set('profile_id', client._id.toString())
      .set('idempotency-key', 'ref-abc-123');

    expect(retry.status).toBe(200);

    const [updatedClient, updatedContractor] = await Promise.all([
      Profile.findById(client._id),
      Profile.findById(contractor._id),
    ]);
    expect(updatedClient!.balance).toBe(400);
    expect(updatedContractor!.balance).toBe(100);
  });

  test('concurrent payments do not overdraft the client', async () => {
    const client = await Profile.create({
      firstName: 'Alice', lastName: 'Smith', profession: 'Engineer',
      balance: 100, type: 'client',
    });
    const contractor = await Profile.create({
      firstName: 'Bob', lastName: 'Jones', profession: 'Designer',
      balance: 0, type: 'contractor',
    });
    const contract = await Contract.create({
      terms: 'Work', status: 'in_progress',
      clientId: client._id, contractorId: contractor._id,
    });
    const [job1, job2] = await Job.insertMany([
      { description: 'Task A', price: 100, contractId: contract._id },
      { description: 'Task B', price: 100, contractId: contract._id },
    ]);

    const results = await Promise.allSettled([
      paymentService.payJob(job1._id.toString(), client._id),
      paymentService.payJob(job2._id.toString(), client._id),
    ]);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const updatedClient = await Profile.findById(client._id);
    expect(updatedClient!.balance).toBeGreaterThanOrEqual(0);
    expect(updatedClient!.balance).toBe(0);
  });
});
