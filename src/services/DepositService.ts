import mongoose, { Types } from 'mongoose';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { JobRepository } from '../repositories/JobRepository';
import { ContractRepository } from '../repositories/ContractRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { IProfile } from '../models/Profile';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { DEPOSIT_LIMIT_PCT } from '../constants';

export class DepositService {
  constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly jobRepo: JobRepository,
    private readonly contractRepo: ContractRepository,
    private readonly auditLogRepo: AuditLogRepository,
  ) {}

  async deposit(
    targetUserId: string,
    requestingProfileId: Types.ObjectId,
    amount: number,
  ): Promise<IProfile> {
    // Only a client can deposit into their own account
    const target = await this.profileRepo.findById(targetUserId);
    if (!target) throw new NotFoundError('User not found');

    if (!target._id.equals(requestingProfileId)) {
      throw new ForbiddenError('You can only deposit into your own account');
    }

    if (target.type !== 'client') {
      throw new ForbiddenError('Only clients can make deposits');
    }

    if (amount <= 0) throw new BadRequestError('Deposit amount must be positive');

    // Calculate 25% cap against total value of unpaid jobs
    const contracts = await this.contractRepo.findInProgressForProfile(requestingProfileId);
    const contractIds = contracts.map((c) => c._id as Types.ObjectId);
    const unpaidJobs = await this.jobRepo.findUnpaidForContracts(contractIds);
    const totalUnpaid = unpaidJobs.reduce((sum, j) => sum + j.price, 0);
    const maxDeposit = totalUnpaid * DEPOSIT_LIMIT_PCT;

    if (amount > maxDeposit) {
      throw new BadRequestError(
        `Deposit exceeds limit. Max allowed: ${maxDeposit.toFixed(2)} (${DEPOSIT_LIMIT_PCT * 100}% of unpaid jobs total ${totalUnpaid.toFixed(2)})`,

      );
    }

    const session = await mongoose.startSession();

    try {
      let result: IProfile | null = null;

      await session.withTransaction(async () => {
        const updated = await this.profileRepo.deposit(target._id, amount, session);
        if (!updated) throw new NotFoundError('User not found during transaction');

        await this.auditLogRepo.createMany(
          [
            {
              profileId: target._id,
              action: 'deposit',
              oldBalance: target.balance,
              newBalance: updated.balance,
              amount,
            },
          ],
          session,
        );

        result = updated;
      });

      if (!result) throw new Error('Transaction did not complete');
      return result;
    } finally {
      await session.endSession();
    }
  }
}
