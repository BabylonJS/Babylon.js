#!/usr/bin/env node

import prompts from "prompts";
import path from "path";
import fs from "fs";
import { generatePackageJson } from "./generators/packageJson";
import { generateIndexHtml } from "./generators/indexHtml";
import { generateSceneCode } from "./generators/sceneCode";
import { generateBundlerConfig } from "./generators/bundlerConfig";
import { generateTsConfig } from "./generators/tsConfig";

export type ModuleFormat = "es6" | "umd";
export type Language = "ts" | "js";
export type Bundler = "vite" | "webpack" | "rollup" | "none";

export interface ProjectOptions {
    projectName: string;
    moduleFormat: ModuleFormat;
    language: Language;
    bundler: Bundler;
}

async function main(): Promise<void> {
    console.log("\n🏗️  Create Babylon.js Project\n");

    const response = await prompts(
        [
            {
                type: "text",
                name: "projectName",
                message: "Project name:",
                initial: "my-babylonjs-app",
                validate: (value: string) => (value.trim().length > 0 ? true : "Project name is required"),
            },
            {
                type: "select",
                name: "moduleFormat",
                message: "Module format:",
                choices: [
                    { title: "ES6 (@babylonjs/core) — tree-shakeable ES modules", value: "es6" },
                    { title: "UMD (babylonjs) — global BABYLON namespace", value: "umd" },
                ],
            },
            {
                type: "select",
                name: "language",
                message: "Language:",
                choices: [
                    { title: "TypeScript", value: "ts" },
                    { title: "JavaScript", value: "js" },
                ],
            },
            {
                type: "select",
                name: "bundler",
                message: "Bundler:",
                choices: (_, values) => {
                    const base = [
                        { title: "Vite", value: "vite" },
                        { title: "Webpack", value: "webpack" },
                        { title: "Rollup", value: "rollup" },
                    ];
                    if (values.moduleFormat === "umd") {
                        base.push({ title: "None (CDN script tags only)", value: "none" });
                    }
                    return base;
                },
            },
        ],
        {
            onCancel: () => {
                console.log("\nProject creation cancelled.");
                process.exit(0);
            },
        }
    );

    const options: ProjectOptions = {
        projectName: response.projectName.trim(),
        moduleFormat: response.moduleFormat,
        language: response.language,
        bundler: response.bundler,
    };

    const targetDir = path.resolve(process.cwd(), options.projectName);

    if (fs.existsSync(targetDir)) {
        const { overwrite } = await prompts({
            type: "confirm",
            name: "overwrite",
            message: `Directory "${options.projectName}" already exists. Overwrite?`,
            initial: false,
        });
        if (!overwrite) {
            console.log("Cancelled.");
            process.exit(0);
        }
        fs.rmSync(targetDir, { recursive: true, force: true });
    }

    scaffoldProject(targetDir, options);

    console.log(`\n✅ Project created in ./${options.projectName}\n`);
    console.log("Next steps:\n");
    console.log(`  cd ${options.projectName}`);
    if (options.bundler !== "none") {
        console.log("  npm install");
        console.log("  npm run dev\n");
    } else {
        console.log("  Open index.html in your browser\n");
    }
}

function scaffoldProject(targetDir: string, options: ProjectOptions): void {
    fs.mkdirSync(targetDir, { recursive: true });

    if (options.bundler === "none") {
        // CDN-only: just an HTML file
        writeFile(targetDir, "index.html", generateIndexHtml(options));
        return;
    }

    // All bundler-based projects get these
    writeFile(targetDir, "package.json", generatePackageJson(options));
    writeFile(targetDir, "index.html", generateIndexHtml(options));

    const ext = options.language === "ts" ? "ts" : "js";
    fs.mkdirSync(path.join(targetDir, "src"), { recursive: true });
    writeFile(targetDir, `src/index.${ext}`, generateSceneCode(options));

    if (options.language === "ts") {
        writeFile(targetDir, "tsconfig.json", generateTsConfig(options));
    }

    const bundlerConfig = generateBundlerConfig(options);
    if (bundlerConfig) {
        writeFile(targetDir, bundlerConfig.filename, bundlerConfig.content);
    }
}

function writeFile(dir: string, filePath: string, content: string): void {
    const fullPath = path.join(dir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
