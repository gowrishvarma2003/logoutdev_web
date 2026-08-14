/**
 * Skill Categorization System
 * Maps individual skills to their categories for better organization
 */

export const SKILL_CATEGORIES = {
  languages: [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "Go",
    "Rust",
    "C++",
    "Ruby",
    "PHP",
    "Swift",
    "Kotlin",
    "C#",
    "C",
    "Elixir",
    "Clojure",
    "Scala",
    "R",
    "MATLAB",
    "Perl",
    "Lua",
    "Shell",
    "Bash",
  ],
  frameworks: [
    "React",
    "Next.js",
    "Vue",
    "Angular",
    "Node.js",
    "Express",
    "Django",
    "Rails",
    "Spring",
    "FastAPI",
    "Flask",
    "Fastify",
    "NestJS",
    "Remix",
    "Svelte",
    "Astro",
    "Phoenix",
    "Gin",
    "Echo",
    "Actix",
  ],
  databases: [
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "SQLite",
    "Supabase",
    "Firebase",
    "Cassandra",
    "Elasticsearch",
    "DynamoDB",
    "Databricks",
    "Snowflake",
    "BigQuery",
    "CouchDB",
    "Neo4j",
    "ClickHouse",
  ],
  tools: [
    "Git",
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "Azure",
    "Vercel",
    "Linux",
    "CI/CD",
    "GitHub",
    "GitLab",
    "Bitbucket",
    "Jenkins",
    "GitHub Actions",
    "CircleCI",
    "TravisCI",
    "Terraform",
    "Ansible",
    "Prometheus",
    "Grafana",
    "ELK Stack",
    "Nginx",
    "Apache",
    "Heroku",
    "Netlify",
    "DigitalOcean",
    "Linode",
  ],
  other: [],
};

export type SkillCategoryKey = keyof typeof SKILL_CATEGORIES;

/**
 * Maps a skill name to its category
 * Returns the category key, or 'other' if not found
 */
export function categorizeSkill(skill: string): SkillCategoryKey {
  const trimmedSkill = skill.trim();

  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (
      skills.some(
        (s) => s.toLowerCase() === trimmedSkill.toLowerCase()
      )
    ) {
      return category as SkillCategoryKey;
    }
  }

  return "other";
}

/**
 * Get a human-readable label for a category
 */
export function getCategoryLabel(category: SkillCategoryKey): string {
  const labels: Record<SkillCategoryKey, string> = {
    languages: "Languages",
    frameworks: "Frameworks",
    databases: "Databases",
    tools: "Tools & Platforms",
    other: "Other",
  };

  return labels[category];
}

/**
 * Get the emoji icon for a category
 */
export function getCategoryIcon(category: SkillCategoryKey): string {
  const icons: Record<SkillCategoryKey, string> = {
    languages: "🔤",
    frameworks: "🏗️",
    databases: "💾",
    tools: "⚙️",
    other: "📌",
  };

  return icons[category];
}

/**
 * Get the color class for a category
 */
export function getCategoryColorClass(
  category: SkillCategoryKey
): string {
  const colors: Record<SkillCategoryKey, string> = {
    languages: "violet",
    frameworks: "sky",
    databases: "emerald",
    tools: "orange",
    other: "zinc",
  };

  return colors[category];
}
