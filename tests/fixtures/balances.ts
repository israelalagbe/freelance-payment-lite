import Profile, { IProfile } from '../../src/models/Profile';
import Contract, { IContract } from '../../src/models/Contract';
import Job, { IJob } from '../../src/models/Job';

export interface BalanceFixtures {
  client: IProfile;
  contractor: IProfile;
  contract: IContract;
  unpaidJob: IJob;
}

export interface BalanceNoJobFixtures {
  client: IProfile;
  contractor: IProfile;
  contract: IContract;
}

export async function createBalanceFixtures(clientBalance = 200): Promise<BalanceFixtures> {
  const [client, contractor] = await Profile.insertMany([
    { firstName: 'Carol', lastName: 'White', profession: 'Manager', balance: clientBalance, type: 'client' },
    { firstName: 'Dave', lastName: 'Black', profession: 'Developer', balance: 0, type: 'contractor' },
  ]);

  const contract = await Contract.create({
    terms: 'Build features',
    status: 'in_progress',
    clientId: client._id,
    contractorId: contractor._id,
  });

  // Unpaid job worth 200 — so 25% cap = 50
  const unpaidJob = await Job.create({
    description: 'Feature work',
    price: 200,
    contractId: contract._id,
  });

  return { client, contractor, contract, unpaidJob };
}

export interface ContractorFixture {
  contractor: IProfile;
}

/** Creates a standalone contractor profile with no contracts or jobs. */
export async function createContractorFixture(): Promise<ContractorFixture> {
  const contractor = await Profile.create({
    firstName: 'Con',
    lastName: 'Tractor',
    profession: 'Dev',
    balance: 0,
    type: 'contractor',
  });
  return { contractor };
}

/** Same as createBalanceFixtures but with no jobs — max deposit cap is 0. */
export async function createBalanceFixturesNoJobs(clientBalance = 100): Promise<BalanceNoJobFixtures> {
  const [client, contractor] = await Profile.insertMany([
    { firstName: 'Empty', lastName: 'Client', profession: 'Tester', balance: clientBalance, type: 'client' },
    { firstName: 'No', lastName: 'Jobs', profession: 'Dev', balance: 0, type: 'contractor' },
  ]);

  const contract = await Contract.create({
    terms: 'Nothing',
    status: 'in_progress',
    clientId: client._id,
    contractorId: contractor._id,
  });

  return { client, contractor, contract };
}
