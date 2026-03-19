import { ClientSession, Types } from 'mongoose';
import Profile, { IProfile } from '../models/Profile';

export class ProfileRepository {
  async findById(id: string | Types.ObjectId, session?: ClientSession): Promise<IProfile | null> {
    return Profile.findById(id).session(session ?? null);
  }

  /**
   * Debit a client using optimistic locking.
   * Matches on both _id and __v so a concurrent modification causes a null return (409 signal).
   */
  async debitWithOptimisticLock(
    profileId: Types.ObjectId,
    version: number,
    amount: number,
    session: ClientSession,
  ): Promise<IProfile | null> {
    return Profile.findOneAndUpdate(
      { _id: profileId, __v: version, balance: { $gte: amount } },
      { $inc: { balance: -amount, __v: 1 } },
      { returnDocument: 'after', session },
    );
  }

  async credit(
    profileId: Types.ObjectId,
    amount: number,
    session: ClientSession,
  ): Promise<IProfile | null> {
    return Profile.findByIdAndUpdate(
      profileId,
      { $inc: { balance: amount } },
      { returnDocument: 'after', session },
    );
  }

  async deposit(
    profileId: Types.ObjectId,
    amount: number,
    session: ClientSession,
  ): Promise<IProfile | null> {
    return Profile.findByIdAndUpdate(
      profileId,
      { $inc: { balance: amount } },
      { returnDocument: 'after', session },
    );
  }
}

