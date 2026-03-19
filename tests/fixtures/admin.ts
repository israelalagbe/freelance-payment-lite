import Profile, { IProfile } from '../../src/models/Profile';
import Contract, { IContract } from '../../src/models/Contract';
import Job, { IJob } from '../../src/models/Job';

export interface AdminFixtures {
  clients: IProfile[];
  contractors: IProfile[];
  contracts: IContract[];
  jobs: IJob[];
}

/**
 * Creates two clients and two contractors with different professions.
 * All jobs are marked paid with paymentDate set to the given date.
 *
 * Earnings breakdown:
 *   - programmer contractor: 300 (job 1) + 200 (job 3) = 500
 *   - designer contractor:   150 (job 2)
 *
 * Spend breakdown:
 *   - clientA: 300 (job 1) + 150 (job 2) = 450
 *   - clientB: 200 (job 3)
 */
export async function createAdminFixtures(paymentDate: Date): Promise<AdminFixtures> {
  const [clientA, clientB, programmer, designer] = await Profile.insertMany([
    { firstName: 'Alice', lastName: 'Alpha', profession: 'Manager', balance: 0, type: 'client' },
    { firstName: 'Bob', lastName: 'Beta', profession: 'Director', balance: 0, type: 'client' },
    { firstName: 'Carl', lastName: 'Code', profession: 'Programmer', balance: 0, type: 'contractor' },
    { firstName: 'Dana', lastName: 'Draw', profession: 'Designer', balance: 0, type: 'contractor' },
  ]);

  const [contractA, contractB, contractC] = await Contract.insertMany([
    { terms: 'Build API', status: 'in_progress', clientId: clientA._id, contractorId: programmer._id },
    { terms: 'Design UI', status: 'in_progress', clientId: clientA._id, contractorId: designer._id },
    { terms: 'Build Mobile', status: 'in_progress', clientId: clientB._id, contractorId: programmer._id },
  ]);

  const jobs = await Job.insertMany([
    { description: 'API work', price: 300, paid: true, paymentDate, contractId: contractA._id },
    { description: 'UI work', price: 150, paid: true, paymentDate, contractId: contractB._id },
    { description: 'Mobile work', price: 200, paid: true, paymentDate, contractId: contractC._id },
  ]);

  return {
    clients: [clientA, clientB],
    contractors: [programmer, designer],
    contracts: [contractA, contractB, contractC],
    jobs,
  };
}
