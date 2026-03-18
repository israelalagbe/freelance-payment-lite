import { Types } from 'mongoose';
import { ContractRepository } from '../repositories/ContractRepository';
import { IContract } from '../models/Contract';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export class ContractService {
  constructor(private readonly contractRepo: ContractRepository) {}

  async getContractForProfile(
    contractId: string,
    profileId: Types.ObjectId,
  ): Promise<IContract> {
    const contract = await this.contractRepo.findById(contractId);
    if (!contract) throw new NotFoundError('Contract not found');

    const isParticipant =
      contract.clientId.equals(profileId) || contract.contractorId.equals(profileId);
    if (!isParticipant) throw new ForbiddenError();

    return contract;
  }

  async getActiveContractsForProfile(profileId: Types.ObjectId): Promise<IContract[]> {
    return this.contractRepo.findAllActiveForProfile(profileId);
  }
}
