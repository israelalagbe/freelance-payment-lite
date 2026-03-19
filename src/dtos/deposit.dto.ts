import { z } from 'zod';

export const DepositDto = z.object({
  amount: z.number({ error: 'amount must be a number' }).positive('amount must be positive'),
});

export type DepositDto = z.infer<typeof DepositDto>;
