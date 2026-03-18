import mongoose, { Types } from 'mongoose';
import { JobRepository } from '../repositories/JobRepository';
import { ContractRepository } from '../repositories/ContractRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { IJob } from '../models/Job';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';

export class PaymentService {
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly contractRepo: ContractRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly auditLogRepo: AuditLogRepository,
  ) {}

  async getUnpaidJobs(profileId: Types.ObjectId): Promise<IJob[]> {
    const contracts = await this.contractRepo.findInProgressForProfile(profileId);
    const contractIds = contracts.map((c) => c._id as Types.ObjectId);
    return this.jobRepo.findUnpaidForContracts(contractIds);
  }

  async payJob(
    jobId: string,
    clientProfileId: Types.ObjectId,
    paymentReference?: string,
  ): Promise<IJob> {
    // Idempotency: same reference → return the already-paid job
    if (paymentReference) {
      const existing = await this.jobRepo.findByPaymentReference(paymentReference);
      if (existing) return existing;
    }

    const session = await mongoose.startSession();

    try {
      let result: IJob | null = null;

      await session.withTransaction(async () => {
        const job = await this.jobRepo.findById(jobId, session);
        if (!job) throw new NotFoundError('Job not found');
        if (job.paid) throw new BadRequestError('Job is already paid');

        const contract = await this.contractRepo.findById(job.contractId, session);
        if (!contract) throw new NotFoundError('Contract not found');
        if (contract.status !== 'in_progress') throw new BadRequestError('Contract is not active');
        if (!contract.clientId.equals(clientProfileId)) {
          throw new ForbiddenError('Only the contract client can pay for this job');
        }

        const client = await this.profileRepo.findById(clientProfileId, session);
        if (!client) throw new NotFoundError('Client not found');
        if (client.balance < job.price) throw new BadRequestError('Insufficient balance');

        const updatedClient = await this.profileRepo.debitWithOptimisticLock(
          clientProfileId,
          client.__v,
          job.price,
          session,
        );
        // null = concurrent request already changed __v → let caller retry
        if (!updatedClient) throw new ConflictError('Payment conflict — please retry');

        const updatedContractor = await this.profileRepo.credit(
          contract.contractorId,
          job.price,
          session,
        );
        if (!updatedContractor) throw new NotFoundError('Contractor not found');

        result = await this.jobRepo.markPaid(job._id, paymentReference ?? null, session);

        await this.auditLogRepo.createMany(
          [
            {
              profileId: clientProfileId,
              action: 'payment',
              oldBalance: client.balance,
              newBalance: updatedClient.balance,
              amount: job.price,
              jobId: job._id,
            },
            {
              profileId: contract.contractorId,
              action: 'payment',
              oldBalance: updatedContractor.balance - job.price,
              newBalance: updatedContractor.balance,
              amount: job.price,
              jobId: job._id,
            },
          ],
          session,
        );
      });

      if (!result) throw new Error('Transaction did not complete');
      return result;
    } finally {
      await session.endSession();
    }
  }
}
