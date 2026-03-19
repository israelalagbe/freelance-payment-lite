import Profile, { IProfile } from '../../src/models/Profile';
import Contract, { IContract } from '../../src/models/Contract';
import Job, { IJob } from '../../src/models/Job';

export interface JobFixtures {
  client: IProfile;
  contractor: IProfile;
  contract: IContract;
  job: IJob;
}

export async function createJobFixtures(clientBalance = 500): Promise<JobFixtures> {
  const [client, contractor] = await Profile.insertMany([
    { firstName: 'Alice', lastName: 'Smith', profession: 'Engineer', balance: clientBalance, type: 'client' },
    { firstName: 'Bob', lastName: 'Jones', profession: 'Designer', balance: 0, type: 'contractor' },
  ]);

  const contract = await Contract.create({
    terms: 'Build API',
    status: 'in_progress',
    clientId: client._id,
    contractorId: contractor._id,
  });

  const job = await Job.create({ description: 'Endpoints', price: 100, contractId: contract._id });

  return { client, contractor, contract, job };
}
