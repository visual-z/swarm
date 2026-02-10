import { z } from 'zod';
import {
  AgentStatusSchema,
  SkillSchema,
  AgentCardSchema,
  AgentSchema,
  RegisterAgentRequestSchema,
  HeartbeatRequestSchema,
} from '../schemas/agent.js';

export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type AgentCard = z.infer<typeof AgentCardSchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type RegisterAgentRequest = z.infer<typeof RegisterAgentRequestSchema>;
export type HeartbeatRequest = z.infer<typeof HeartbeatRequestSchema>;

export {
  AgentStatusSchema,
  SkillSchema,
  AgentCardSchema,
  AgentSchema,
  RegisterAgentRequestSchema,
  HeartbeatRequestSchema,
};
