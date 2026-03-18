import { Types } from 'mongoose';
import Contract, { IContract } from '../models/Contract';

export class ContractRepository {
  async findById(id: string | Types.ObjectId): Promise<IContract | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Contract.findById(id);
  }

  async findAllActiveForProfile(profileId: Types.ObjectId): Promise<IContract[]> {
    return Contract.find({
      status: { $ne: 'terminated' },
      $or: [{ clientId: profileId }, { contractorId: profileId }],
    });
  }
}
