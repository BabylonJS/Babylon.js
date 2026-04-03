import { generatePackageJson } from "../../src/generators/packageJson";
import type { ProjectOptions } from "../../src/index";

describe("generatePackageJson", () => {
    it("generates ES6 + TypeScript + Vite config with loaders", () => {
        const options: ProjectOptions = {
            projectName: "test-app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "vite",
        };
        const result = JSON.parse(generatePackageJson(options));
        expect(result.name).toBe("test-app");
        expect(result.dependencies["@babylonjs/core"]).toBeDefined();
        expect(result.dependencies["@babylonjs/loaders"]).toBeDefined();
        expect(result.dependencies["babylonjs"]).toBeUndefined();
        expect(result.devDependencies["vite"]).toBeDefined();
        expect(result.devDependencies["typescript"]).toBeDefined();
        expect(result.scripts.dev).toBe("vite");
        expect(result.type).toBe("module");
    });

    it("generates UMD + JavaScript + Webpack config with loaders", () => {
        const options: ProjectOptions = {
            projectName: "umd-app",
            moduleFormat: "umd",
            language: "js",
            bundler: "webpack",
        };
        const result = JSON.parse(generatePackageJson(options));
        expect(result.dependencies["babylonjs"]).toBeDefined();
        expect(result.dependencies["babylonjs-loaders"]).toBeDefined();
        expect(result.dependencies["@babylonjs/core"]).toBeUndefined();
        expect(result.devDependencies["webpack"]).toBeDefined();
        expect(result.devDependencies["typescript"]).toBeUndefined();
        expect(result.devDependencies["ts-loader"]).toBeUndefined();
        expect(result.scripts.dev).toContain("webpack");
    });

    it("generates Rollup config with TypeScript deps", () => {
        const options: ProjectOptions = {
            projectName: "rollup-app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "rollup",
        };
        const result = JSON.parse(generatePackageJson(options));
        expect(result.devDependencies["rollup"]).toBeDefined();
        expect(result.devDependencies["@rollup/plugin-typescript"]).toBeDefined();
        expect(result.devDependencies["tslib"]).toBeDefined();
        expect(result.scripts.dev).toContain("rollup");
    });

    it("does not include bundler deps for CDN-only", () => {
        const options: ProjectOptions = {
            projectName: "cdn-app",
            moduleFormat: "umd",
            language: "js",
            bundler: "none",
        };
        // CDN-only doesn't generate a package.json (handled by scaffoldProject),
        // but the generator still produces valid output if called
        const result = JSON.parse(generatePackageJson(options));
        expect(result.dependencies["babylonjs"]).toBeDefined();
        expect(result.devDependencies["vite"]).toBeUndefined();
        expect(result.devDependencies["webpack"]).toBeUndefined();
        expect(result.devDependencies["rollup"]).toBeUndefined();
    });
});
