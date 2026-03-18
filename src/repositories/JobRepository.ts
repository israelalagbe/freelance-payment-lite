import { ClientSession, Types } from 'mongoose';
import Job, { IJob } from '../models/Job';

export class JobRepository {
  async findById(id: string | Types.ObjectId, session?: ClientSession): Promise<IJob | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Job.findById(id).session(session ?? null);
  }

  async findUnpaidForContracts(contractIds: Types.ObjectId[]): Promise<IJob[]> {
    return Job.find({ contractId: { $in: contractIds }, paid: false });
  }

  async findByPaymentReference(reference: string): Promise<IJob | null> {
    return Job.findOne({ paymentReference: reference });
  }

  async markPaid(
    jobId: Types.ObjectId,
    paymentReference: string | null,
    session: ClientSession,
  ): Promise<IJob | null> {
    return Job.findByIdAndUpdate(
      jobId,
      { paid: true, paymentDate: new Date(), paymentReference },
      { returnDocument: 'after', session },
    );
  }
}
