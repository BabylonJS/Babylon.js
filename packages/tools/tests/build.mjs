import { readdirSync } from "fs";
import { join, basename, dirname } from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { analyzeMetafile, build } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const shouldAnalyze = process.argv.includes("--analyze");

const files = readdirSync(join(__dirname, "src"));
for (const file of files) {
    // TODO: Figure out why this entry uses so much memory when bundling sceneWithInspector.js
    if (file !== "sceneWithInspector.ts") {
        console.log();
        console.log(chalk.bold(chalk.blue(`===== Building ${file} =====`)));
        const entryName = basename(file, ".ts");
        const result = await build({
            entryPoints: [join(__dirname, "src", file)],
            bundle: true,
            minify: true,
            sourcemap: true,
            platform: "browser",
            format: "iife",
            outfile: join(__dirname, "dist", entryName, "main.js"),
            metafile: shouldAnalyze,
            logLevel: "info",
        });

        if (result.metafile) {
            console.log(await analyzeMetafile(result.metafile));
        }
    }
}
