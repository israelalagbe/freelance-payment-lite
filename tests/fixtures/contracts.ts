import Profile, { IProfile } from '../../src/models/Profile';
import Contract, { IContract } from '../../src/models/Contract';

export interface ContractFixtures {
  client: IProfile;
  contractor: IProfile;
  stranger: IProfile;
  contract: IContract;
}

export async function createContractFixtures(): Promise<ContractFixtures> {
  const [client, contractor, stranger] = await Profile.insertMany([
    { firstName: 'Alice', lastName: 'Smith', profession: 'Engineer', balance: 500, type: 'client' },
    { firstName: 'Bob', lastName: 'Jones', profession: 'Designer', balance: 0, type: 'contractor' },
    { firstName: 'Eve', lastName: 'X', profession: 'Hacker', balance: 0, type: 'client' },
  ]);

  const contract = await Contract.create({
    terms: 'Build API',
    status: 'in_progress',
    clientId: client._id,
    contractorId: contractor._id,
  });

  return { client, contractor, stranger, contract };
}
