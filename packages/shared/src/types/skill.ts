export interface SkillInfo {
  name: string;
  description: string;
  location: string;        // file path or URL
  content: string;          // full markdown content (body, without frontmatter)
  metadata: Record<string, string>;  // extra frontmatter fields
}

export interface SkillSummary {
  name: string;
  description: string;
  location: string;
  metadata: Record<string, string>;
}
