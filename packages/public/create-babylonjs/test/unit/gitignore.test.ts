import { generateGitignore } from "../../src/generators/gitignore";
import type { ProjectOptions } from "../../src/index";

describe("generateGitignore", () => {
    const options: ProjectOptions = {
        projectName: "test-app",
        moduleFormat: "es6",
        language: "ts",
        bundler: "vite",
    };

    it("generates correct gitignore content", () => {
        const content = generateGitignore(options);
        expect(content).toContain("node_modules/");
        expect(content).toContain("dist/");
        expect(content).toContain(".idea/");
        expect(content).toContain(".DS_Store");
        expect(content).toContain("Thumbs.db");
        expect(content).toContain("*.tsbuildinfo");
    });
});
