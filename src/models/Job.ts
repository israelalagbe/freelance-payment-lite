import { Schema, model, Document, Types } from 'mongoose';

export interface IJob extends Document {
  _id: Types.ObjectId;
  description: string;
  price: number;
  paid: boolean;
  paymentDate: Date | null;
  contractId: Types.ObjectId;
  // Client-supplied reference on the payment request (maps to Idempotency-Key header).
  // On retry we look up by this value and recompute the response from the job's current state.
  paymentReference: string | null;
}

const jobSchema = new Schema<IJob>(
  {
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    paid: { type: Boolean, default: false },
    paymentDate: { type: Date, default: null },
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    paymentReference: { type: String, default: null },
  },
  { timestamps: true }
);

jobSchema.index({ contractId: 1, paid: 1 });
jobSchema.index({ paid: 1, paymentDate: 1 });
// Only paid jobs have a paymentReference — partial filter excludes null values from the index
jobSchema.index(
  { paymentReference: 1 },
  { unique: true, partialFilterExpression: { paymentReference: { $type: 'string' } } },
);

const Job = model<IJob>('Job', jobSchema);
export default Job;
