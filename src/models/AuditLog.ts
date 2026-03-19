import { Schema, model, Document, Types } from 'mongoose';

export type AuditAction = 'payment' | 'deposit';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  profileId: Types.ObjectId;
  action: AuditAction;
  oldBalance: number;
  newBalance: number;
  amount: number;
  jobId: Types.ObjectId | null;
  timestamp: Date;
}

/**
 * Append-only. Pre-hooks below throw on any update attempt to enforce immutability.
 */
const auditLogSchema = new Schema<IAuditLog>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    action: { type: String, enum: ['payment', 'deposit'], required: true },
    oldBalance: { type: Number, required: true },
    newBalance: { type: Number, required: true },
    amount: { type: Number, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false, strict: true }
);

function blockUpdate(this: unknown): never {
  throw new Error('AuditLog records are immutable — append only');
}

auditLogSchema.pre('findOneAndUpdate', blockUpdate);
auditLogSchema.pre('updateOne', blockUpdate);
auditLogSchema.pre('updateMany', blockUpdate);

const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
