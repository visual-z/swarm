import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { listSkills, getSkill } from '../services/skill-service.js';

const skillsRoute = new Hono();

skillsRoute.get('/', (c) => {
  const skills = listSkills();
  return c.json({ success: true, data: skills });
});

skillsRoute.get('/:name', (c) => {
  const name = c.req.param('name');
  const skill = getSkill(name);
  
  if (!skill) {
    throw new HTTPException(404, {
      message: `Skill "${name}" not found`,
    });
  }
  
  return c.json({ success: true, data: skill });
});

export { skillsRoute };
