import { Schema, model, Document, Types } from 'mongoose';

export type ProfileType = 'client' | 'contractor';

export interface IProfile extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  profession: string;
  balance: number;
  type: ProfileType;
  __v: number; // used for optimistic concurrency control
}

const profileSchema = new Schema<IProfile>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    profession: { type: String, required: true, trim: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    type: { type: String, enum: ['client', 'contractor'], required: true },
  },
  { timestamps: true }
);

profileSchema.index({ type: 1 });
profileSchema.index({ profession: 1 });

const Profile = model<IProfile>('Profile', profileSchema);
export default Profile;
