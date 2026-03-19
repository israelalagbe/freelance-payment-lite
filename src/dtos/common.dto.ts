import { z } from 'zod';

const objectId = z.string({ error: 'must be a string' }).regex(/^[a-f\d]{24}$/i, 'must be a valid ObjectId');

export const ContractParams = z.object({
  id: objectId,
});

export const JobParams = z.object({
  job_id: objectId,
});

export const UserParams = z.object({
  userId: objectId,
});

export type ContractParams = z.infer<typeof ContractParams>;
export type JobParams = z.infer<typeof JobParams>;
export type UserParams = z.infer<typeof UserParams>;
