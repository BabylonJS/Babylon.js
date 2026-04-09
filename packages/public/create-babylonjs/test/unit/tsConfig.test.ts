import { generateTsConfig } from "../../src/generators/tsConfig";
import type { ProjectOptions } from "../../src/index";

describe("generateTsConfig", () => {
    it("generates ESNext module config for Vite", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "vite",
        };
        const result = JSON.parse(generateTsConfig(options));
        expect(result.compilerOptions.module).toBe("ESNext");
        expect(result.compilerOptions.moduleResolution).toBe("bundler");
        expect(result.compilerOptions.types).toBeUndefined();
    });

    it("generates ES2020 module config for Webpack", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "webpack",
        };
        const result = JSON.parse(generateTsConfig(options));
        expect(result.compilerOptions.module).toBe("ES2020");
        expect(result.compilerOptions.moduleResolution).toBe("node");
    });

    it("includes babylonjs types for UMD format", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "umd",
            language: "ts",
            bundler: "webpack",
        };
        const result = JSON.parse(generateTsConfig(options));
        expect(result.compilerOptions.types).toEqual(["babylonjs"]);
    });

    it("does not include types array for ES6 format", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "rollup",
        };
        const result = JSON.parse(generateTsConfig(options));
        expect(result.compilerOptions.types).toBeUndefined();
    });
});
