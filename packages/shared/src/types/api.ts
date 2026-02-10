import { z } from 'zod';
import {
  ApiResponseSchema,
  PaginatedResponseSchema,
} from '../schemas/api.js';

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
};

export {
  ApiResponseSchema,
  PaginatedResponseSchema,
};
