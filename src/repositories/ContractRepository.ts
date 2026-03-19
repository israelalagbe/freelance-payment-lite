import { ClientSession, Types } from 'mongoose';
import Contract, { IContract } from '../models/Contract';

export class ContractRepository {
  async findById(id: string | Types.ObjectId, session?: ClientSession): Promise<IContract | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Contract.findById(id).session(session ?? null);
  }

  async findAllActiveForProfile(profileId: Types.ObjectId): Promise<IContract[]> {
    return Contract.find({
      status: { $ne: 'terminated' },
      $or: [{ clientId: profileId }, { contractorId: profileId }],
    });
  }

  async findInProgressForProfile(profileId: Types.ObjectId): Promise<IContract[]> {
    return Contract.find({
      status: 'in_progress',
      $or: [{ clientId: profileId }, { contractorId: profileId }],
    }).select('_id');
  }
}
