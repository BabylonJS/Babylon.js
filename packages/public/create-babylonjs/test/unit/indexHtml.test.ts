import { generateIndexHtml } from "../../src/generators/indexHtml";
import type { ProjectOptions } from "../../src/index";

describe("generateIndexHtml", () => {
    it("generates CDN-only HTML with inline script, loaders, and glTF loading", () => {
        const options: ProjectOptions = {
            projectName: "cdn-app",
            moduleFormat: "umd",
            language: "js",
            bundler: "none",
        };
        const html = generateIndexHtml(options);
        expect(html).toContain("cdn.babylonjs.com/babylon.js");
        expect(html).toContain("babylonjs.loaders.min.js");
        expect(html).toContain("BABYLON.Engine");
        expect(html).toContain("BABYLON.AppendSceneAsync");
        expect(html).toContain("createDefaultCamera(true, true, true)");
        expect(html).toContain("createDefaultEnvironment");
        expect(html).toContain('<canvas id="renderCanvas">');
    });

    it("generates Vite HTML with module script tag", () => {
        const options: ProjectOptions = {
            projectName: "vite-app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "vite",
        };
        const html = generateIndexHtml(options);
        expect(html).toContain('type="module"');
        expect(html).toContain('src="/src/index.ts"');
        expect(html).not.toContain("cdn.babylonjs.com");
    });

    it("generates Webpack HTML without script tag (injected by plugin)", () => {
        const options: ProjectOptions = {
            projectName: "wp-app",
            moduleFormat: "es6",
            language: "js",
            bundler: "webpack",
        };
        const html = generateIndexHtml(options);
        expect(html).toContain('<canvas id="renderCanvas">');
        expect(html).not.toContain("<script");
    });

    it("generates Rollup HTML with bundle.js reference", () => {
        const options: ProjectOptions = {
            projectName: "rollup-app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "rollup",
        };
        const html = generateIndexHtml(options);
        expect(html).toContain("dist/bundle.js");
    });
});
