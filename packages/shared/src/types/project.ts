import { z } from 'zod';
import {
  ProjectGroupSchema,
  CreateProjectRequestSchema,
} from '../schemas/project.js';

export type ProjectGroup = z.infer<typeof ProjectGroupSchema>;
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export {
  ProjectGroupSchema,
  CreateProjectRequestSchema,
};
