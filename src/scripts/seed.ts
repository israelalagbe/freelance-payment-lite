import 'dotenv/config';
import mongoose from 'mongoose';
import config from '../config';
import Profile from '../models/Profile';
import Contract from '../models/Contract';
import Job from '../models/Job';
import logger from '../utils/logger';

async function seed() {
  await mongoose.connect(config.mongoUri);
  logger.info('Connected to MongoDB');

  await Promise.all([
    Profile.deleteMany({}),
    Contract.deleteMany({}),
    Job.deleteMany({}),
  ]);
  logger.info('Cleared existing data');

  const [harry, mr_gatz, ash, john, reece] = await Profile.insertMany([
    { firstName: 'Harry', lastName: 'Potter', profession: 'Wizard', balance: 1150, type: 'client' },
    { firstName: 'Mr', lastName: 'Gatz', profession: 'Manager', balance: 1200, type: 'client' },
    { firstName: 'Ash', lastName: 'Ketchum', profession: 'Pokemon Master', balance: 1214, type: 'client' },
    { firstName: 'John', lastName: 'Snow', profession: 'Knows Nothing', balance: 451, type: 'client' },
    { firstName: 'Reece', lastName: 'Witherspoon', profession: 'Actress', balance: 0, type: 'contractor' },
  ]);

  const [alan, jennifer, johnny] = await Profile.insertMany([
    { firstName: 'Alan', lastName: 'Turing', profession: 'Programmer', balance: 22, type: 'contractor' },
    { firstName: 'Jennifer', lastName: 'Lopez', profession: 'Musician', balance: 451, type: 'contractor' },
    { firstName: 'Johnny', lastName: 'Cash', profession: 'Musician', balance: 1200, type: 'contractor' },
  ]);

  const [c1, c2, c3, c4, c5, c6, c7, c8, c9] = await Contract.insertMany([
    { terms: 'bla bla bla', status: 'terminated', clientId: harry._id, contractorId: reece._id },
    { terms: 'bla bla bla', status: 'in_progress', clientId: harry._id, contractorId: reece._id },
    { terms: 'bla bla bla', status: 'in_progress', clientId: harry._id, contractorId: alan._id },
    { terms: 'bla bla bla', status: 'in_progress', clientId: mr_gatz._id, contractorId: johnny._id },
    { terms: 'bla bla bla', status: 'new', clientId: mr_gatz._id, contractorId: alan._id },
    { terms: 'bla bla bla', status: 'in_progress', clientId: ash._id, contractorId: alan._id },
    { terms: 'bla bla bla', status: 'in_progress', clientId: ash._id, contractorId: jennifer._id },
    { terms: 'bla bla bla', status: 'in_progress', clientId: john._id, contractorId: alan._id },
    { terms: 'bla bla bla', status: 'in_progress', clientId: john._id, contractorId: reece._id },
  ]);

  const now = new Date();
  const past = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  await Job.insertMany([
    { description: 'work', price: 200, paid: true, paymentDate: past(10), contractId: c2._id },
    { description: 'work', price: 201, paid: true, paymentDate: past(9), contractId: c3._id },
    { description: 'work', price: 202, paid: true, paymentDate: past(8), contractId: c3._id },
    { description: 'work', price: 200, paid: true, paymentDate: past(7), contractId: c4._id },
    { description: 'work', price: 200, paid: true, paymentDate: past(6), contractId: c7._id },
    { description: 'work', price: 2020, paid: true, paymentDate: past(5), contractId: c7._id },
    { description: 'work', price: 200, paid: false, contractId: c2._id },
    { description: 'work', price: 21, paid: false, contractId: c3._id },
    { description: 'work', price: 19, paid: false, contractId: c4._id },
    { description: 'work', price: 41, paid: false, contractId: c5._id },
    { description: 'work', price: 121, paid: false, contractId: c7._id },
    { description: 'work', price: 21, paid: false, contractId: c8._id },
    { description: 'work', price: 14, paid: false, contractId: c9._id },
  ]);

  logger.info({ profiles: 8, contracts: 9, jobs: 13 }, 'Seed complete');

  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error(err, 'Seed failed');
  process.exit(1);
});
