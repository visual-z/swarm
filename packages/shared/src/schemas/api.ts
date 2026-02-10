import { z } from 'zod';

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    success: z.boolean(),
    data: z.array(itemSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    error: z.string().optional(),
  });
