import { Schema, model, Document, Types } from 'mongoose';

export type ContractStatus = 'new' | 'in_progress' | 'terminated';

export interface IContract extends Document {
  _id: Types.ObjectId;
  terms: string;
  status: ContractStatus;
  clientId: Types.ObjectId;
  contractorId: Types.ObjectId;
}

const contractSchema = new Schema<IContract>(
  {
    terms: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'terminated'],
      default: 'new',
    },
    clientId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  },
  { timestamps: true }
);

contractSchema.index({ clientId: 1, status: 1 });
contractSchema.index({ contractorId: 1, status: 1 });
contractSchema.index({ clientId: 1 });

const Contract = model<IContract>('Contract', contractSchema);
export default Contract;
