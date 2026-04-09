import type { ProjectOptions } from "../index";

export function generatePackageJson(options: ProjectOptions): string {
    const { projectName, moduleFormat, language, bundler } = options;

    const deps: Record<string, string> = {};
    const devDeps: Record<string, string> = {};
    const scripts: Record<string, string> = {};

    // Core Babylon.js dependency + loaders
    if (moduleFormat === "es6") {
        deps["@babylonjs/core"] = "^9.0.0";
        deps["@babylonjs/loaders"] = "^9.0.0";
    } else {
        deps["babylonjs"] = "^9.0.0";
        deps["babylonjs-loaders"] = "^9.0.0";
    }

    // TypeScript
    if (language === "ts") {
        devDeps["typescript"] = "^5.4.0";
    }

    // Bundler-specific deps and scripts
    switch (bundler) {
        case "vite":
            devDeps["vite"] = "^6.0.0";
            if (language === "ts") {
                scripts["dev"] = "vite";
                scripts["build"] = "tsc && vite build";
                scripts["preview"] = "vite preview";
            } else {
                scripts["dev"] = "vite";
                scripts["build"] = "vite build";
                scripts["preview"] = "vite preview";
            }
            break;

        case "webpack":
            devDeps["webpack"] = "^5.90.0";
            devDeps["webpack-cli"] = "^6.0.0";
            devDeps["webpack-dev-server"] = "^5.0.0";
            devDeps["html-webpack-plugin"] = "^5.6.0";
            if (language === "ts") {
                devDeps["ts-loader"] = "^9.5.0";
            }
            scripts["dev"] = "webpack serve --mode development";
            scripts["build"] = "webpack --mode production";
            break;

        case "rollup":
            devDeps["rollup"] = "^4.10.0";
            devDeps["@rollup/plugin-node-resolve"] = "^16.0.0";
            devDeps["@rollup/plugin-commonjs"] = "^28.0.0";
            devDeps["rollup-plugin-serve"] = "^3.0.0";
            devDeps["rollup-plugin-livereload"] = "^2.0.0";
            if (language === "ts") {
                devDeps["@rollup/plugin-typescript"] = "^12.0.0";
                devDeps["tslib"] = "^2.6.0";
            }
            scripts["dev"] = "rollup -c -w";
            scripts["build"] = "rollup -c --environment BUILD:production";
            break;
    }

    const pkg: Record<string, unknown> = {
        name: projectName,
        version: "1.0.0",
        private: true,
        type: bundler === "vite" ? "module" : undefined,
        scripts,
        dependencies: deps,
        devDependencies: devDeps,
    };

    // Remove undefined fields
    Object.keys(pkg).forEach((key) => {
        if (pkg[key] === undefined) {
            delete pkg[key];
        }
    });

    return JSON.stringify(pkg, null, 2) + "\n";
}
