import type { ProjectOptions } from "../index";

export function generateGitignore(_options: ProjectOptions): string {
    return `# Dependencies
node_modules/

# Build output
dist/

# Editor directories and files
.idea/

# OS files
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo
`;
}
