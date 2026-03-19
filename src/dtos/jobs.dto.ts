import { z } from 'zod';

export const PayJobHeaders = z.object({
  'idempotency-key': z.string({ error: 'idempotency-key header is required' }).min(1, 'idempotency-key must not be empty'),
});

export type PayJobHeaders = z.infer<typeof PayJobHeaders>;
