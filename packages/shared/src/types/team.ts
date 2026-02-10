import { z } from 'zod';
import {
  TeamSchema,
  CreateTeamRequestSchema,
} from '../schemas/team.js';

export type Team = z.infer<typeof TeamSchema>;
export type CreateTeamRequest = z.infer<typeof CreateTeamRequestSchema>;

export {
  TeamSchema,
  CreateTeamRequestSchema,
};
