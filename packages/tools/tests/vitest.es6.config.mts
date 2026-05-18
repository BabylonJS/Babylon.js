import { defineConfig } from "vitest/config";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");
const compilerOptions = JSON.parse(fs.readFileSync(path.resolve(rootDir, "tsconfig.json"), "utf8")).compilerOptions;

const convertPathsToAliases = () => {
    const aliases: Record<string, string> = {};
    const paths = compilerOptions.paths;
    for (const key in paths) {
        const aliasKey = key.replace("/*", "");
        const aliasValue = path.resolve(rootDir, paths[key][0].replace("/*", ""));
        aliases[aliasKey] = aliasValue;
    }
    return aliases;
};

export default defineConfig({
    resolve: {
        alias: convertPathsToAliases(),
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    test: {
        globals: true,
        environment: "node",
        pool: "forks",
        include: [path.resolve(__dirname, "test/es6/**/*.test.ts")],
    },
});
