import { z } from 'zod';

export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).toUpperCase(),
});

export const staySearchSchema = z.object({
  destination: z.string().min(1).max(120),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  adults: z.number().int().min(1).max(16),
  children: z.number().int().min(0).max(16).default(0),
  currency: z.string().length(3).toUpperCase().default('NZD'),
});

export const destinationSlugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export type StaySearch = z.infer<typeof staySearchSchema>;
export type MoneyDto = z.infer<typeof moneySchema>;

export function parseStaySearch(input: unknown): StaySearch {
  return staySearchSchema.parse(input);
}
