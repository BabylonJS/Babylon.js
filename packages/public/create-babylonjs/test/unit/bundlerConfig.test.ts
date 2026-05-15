import { generateBundlerConfig } from "../../src/generators/bundlerConfig";
import type { ProjectOptions } from "../../src/index";

describe("generateBundlerConfig", () => {
    it("returns null for CDN-only (no bundler)", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "umd",
            language: "js",
            bundler: "none",
        };
        expect(generateBundlerConfig(options)).toBeNull();
    });

    it("generates vite.config.ts for TypeScript projects", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "vite",
        };
        const result = generateBundlerConfig(options)!;
        expect(result.filename).toBe("vite.config.ts");
        expect(result.content).toContain("defineConfig");
    });

    it("generates vite.config.js for JavaScript projects", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "js",
            bundler: "vite",
        };
        const result = generateBundlerConfig(options)!;
        expect(result.filename).toBe("vite.config.js");
    });

    it("generates webpack.config.js with ts-loader for TypeScript", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "webpack",
        };
        const result = generateBundlerConfig(options)!;
        expect(result.filename).toBe("webpack.config.js");
        expect(result.content).toContain("ts-loader");
        expect(result.content).toContain('entry: "./src/index.ts"');
        expect(result.content).toContain("extensions");
    });

    it("generates webpack.config.js without ts-loader for JavaScript", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "umd",
            language: "js",
            bundler: "webpack",
        };
        const result = generateBundlerConfig(options)!;
        expect(result.content).not.toContain("ts-loader");
        expect(result.content).toContain('entry: "./src/index.js"');
    });

    it("generates rollup.config.mjs with TypeScript plugin when needed", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "rollup",
        };
        const result = generateBundlerConfig(options)!;
        expect(result.filename).toBe("rollup.config.mjs");
        expect(result.content).toContain("@rollup/plugin-typescript");
        expect(result.content).toContain("typescript()");
    });

    it("generates rollup.config.mjs without TypeScript plugin for JS", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "js",
            bundler: "rollup",
        };
        const result = generateBundlerConfig(options)!;
        expect(result.content).not.toContain("@rollup/plugin-typescript");
        expect(result.content).not.toContain("typescript()");
    });
});
