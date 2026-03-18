import { ClientSession, Types } from 'mongoose';
import AuditLog, { AuditAction } from '../models/AuditLog';

interface CreateAuditParams {
  profileId: Types.ObjectId;
  action: AuditAction;
  oldBalance: number;
  newBalance: number;
  amount: number;
  jobId?: Types.ObjectId | null;
}

export class AuditLogRepository {
  async createMany(entries: CreateAuditParams[], session: ClientSession): Promise<void> {
    await AuditLog.create(entries, { session, ordered: true });
  }
}
