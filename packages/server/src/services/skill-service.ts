import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import type { SkillInfo, SkillSummary } from '@swarmroom/shared';

const skills = new Map<string, SkillInfo>();

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };
  
  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      frontmatter[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
    }
  }
  return { frontmatter, body: match[2].trim() };
}

function scanDirectory(dir: string): void {
  if (!existsSync(dir)) return;
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = join(dir, entry.name, 'SKILL.md');
        if (existsSync(skillPath)) {
          try {
            const content = readFileSync(skillPath, 'utf-8');
            const { frontmatter, body } = parseFrontmatter(content);
            
            const name = frontmatter.name || entry.name;
            const description = frontmatter.description || '';
            
            const metadata: Record<string, string> = {};
            for (const [key, value] of Object.entries(frontmatter)) {
              if (key !== 'name' && key !== 'description') {
                metadata[key] = value;
              }
            }
            
            skills.set(name, {
              name,
              description,
              location: skillPath,
              content: body,
              metadata,
            });
          } catch (error) {
            console.warn(`Failed to load skill from ${skillPath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to scan directory ${dir}:`, error);
  }
}

export function scanSkills(dirs?: string[]): void {
  const defaultDirs = [
    resolve(homedir(), '.swarmroom', 'skills'),
    resolve(homedir(), '.opencode', 'skills'),
    resolve(homedir(), '.claude', 'skills'),
    resolve(process.cwd(), '.swarmroom', 'skills'),
  ];
  
  const scanDirs = dirs || defaultDirs;
  
  skills.clear();
  
  for (const dir of scanDirs) {
    scanDirectory(dir);
  }
  
  console.log(`Loaded ${skills.size} skill(s) from ${scanDirs.length} directories`);
}

export function listSkills(): SkillSummary[] {
  return Array.from(skills.values()).map(skill => ({
    name: skill.name,
    description: skill.description,
    location: skill.location,
    metadata: skill.metadata,
  }));
}

export function getSkill(name: string): SkillInfo | null {
  return skills.get(name) || null;
}
