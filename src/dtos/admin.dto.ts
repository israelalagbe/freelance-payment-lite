import { z } from 'zod';

const dateString = z
  .string({ error: 'must be a date string' })
  .refine((v) => !isNaN(Date.parse(v)), { message: 'must be a valid date' })
  .transform((v) => new Date(v));

export const DateRangeQuery = z.object({
  start: dateString,
  end: dateString,
});

export const BestClientsQuery = DateRangeQuery.extend({
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 2))
    .refine((v) => Number.isInteger(v) && v > 0, { message: 'limit must be a positive integer' }),
});

export type DateRangeQuery = z.infer<typeof DateRangeQuery>;
export type BestClientsQuery = z.infer<typeof BestClientsQuery>;
