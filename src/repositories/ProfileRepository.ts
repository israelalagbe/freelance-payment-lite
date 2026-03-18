import { Types } from 'mongoose';
import Profile, { IProfile } from '../models/Profile';

export class ProfileRepository {
  async findById(id: string | Types.ObjectId): Promise<IProfile | null> {
    return Profile.findById(id);
  }
}
