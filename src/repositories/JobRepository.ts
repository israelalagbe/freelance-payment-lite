import { ClientSession, Types } from 'mongoose';
import Job, { IJob } from '../models/Job';

export interface BestProfessionResult {
  profession: string;
  totalEarned: number;
}

export interface BestClientResult {
  id: string;
  fullName: string;
  paid: number;
}

export class JobRepository {
  async findById(id: string | Types.ObjectId, session?: ClientSession): Promise<IJob | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Job.findById(id).session(session ?? null);
  }

  async findUnpaidForContracts(contractIds: Types.ObjectId[]): Promise<IJob[]> {
    return Job.find({ contractId: { $in: contractIds }, paid: false });
  }

  async findByPaymentReference(reference: string): Promise<IJob | null> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return Job.findOne({ paymentReference: reference, paymentDate: { $gte: cutoff } });
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

  async getBestProfession(start: Date, end: Date): Promise<BestProfessionResult | null> {
    const results = await Job.aggregate<BestProfessionResult>([
      {
        $match: {
          paid: true,
          paymentDate: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: 'contracts',
          localField: 'contractId',
          foreignField: '_id',
          as: 'contract',
        },
      },
      { $unwind: '$contract' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'contract.contractorId',
          foreignField: '_id',
          as: 'contractor',
        },
      },
      { $unwind: '$contractor' },
      {
        $group: {
          _id: '$contractor.profession',
          totalEarned: { $sum: '$price' },
        },
      },
      { $sort: { totalEarned: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          profession: '$_id',
          totalEarned: 1,
        },
      },
    ]);

    return results[0] ?? null;
  }

  async getBestClients(start: Date, end: Date, limit: number): Promise<BestClientResult[]> {
    return Job.aggregate<BestClientResult>([
      {
        $match: {
          paid: true,
          paymentDate: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: 'contracts',
          localField: 'contractId',
          foreignField: '_id',
          as: 'contract',
        },
      },
      { $unwind: '$contract' },
      {
        $group: {
          _id: '$contract.clientId',
          paid: { $sum: '$price' },
        },
      },
      { $sort: { paid: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$client' },
      {
        $project: {
          _id: 0,
          id: '$_id',
          fullName: { $concat: ['$client.firstName', ' ', '$client.lastName'] },
          paid: 1,
        },
      },
    ]);
  }
}
