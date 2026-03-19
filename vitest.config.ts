import { defineConfig } from "vitest/config";
import * as fs from "fs";
import * as path from "path";

const compilerOptions = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./tsconfig.json"), "utf8")).compilerOptions;

/**
 * Convert tsconfig paths to Vitest resolve aliases
 */
const convertPathsToAliases = () => {
    const aliases: Record<string, string> = {};
    const paths = compilerOptions.paths;
    for (const key in paths) {
        // Convert glob patterns to regex-compatible aliases
        const aliasKey = key.replace("/*", "");
        const aliasValue = path.resolve(__dirname, "packages", paths[key][0].replace("/*", ""));
        aliases[aliasKey] = aliasValue;
    }
    return aliases;
};

const aliases = convertPathsToAliases();

const createProjectConfig = (type: string) => {
    const globalSetupLocation = path.resolve(".", `vitest.${type}.setup.ts`);
    const setupFileLocation = path.resolve(".", `vitest.${type}.setup.afterEnv.ts`);
    const globalSetup = fs.existsSync(globalSetupLocation) ? globalSetupLocation : undefined;
    const setupFiles: string[] = [path.resolve(".", "vitest.setup.ts")];
    if (fs.existsSync(setupFileLocation)) {
        setupFiles.push(setupFileLocation);
    }

    return {
        name: type,
        include: [`packages/**/test/${type}/**/*.test.{ts,tsx}`],
        exclude: ["**/node_modules/**", "**/packages/*/src/**"],
        globals: true,
        environment: "node",
        globalSetup,
        setupFiles,
        deps: {
            moduleDirectories: ["node_modules"],
        },
        server: {
            deps: {
                external: ["draco3dgltf"],
            },
        },
    };
};

export default defineConfig({
    resolve: {
        alias: {
            ...aliases,
        },
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    server: {
        deps: {
            external: ["draco3dgltf"],
        },
    },
    test: {
        globals: true,
        environment: "node",
        projects: [
            {
                test: createProjectConfig("unit"),
                resolve: {
                    alias: aliases,
                    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                },
            },
            {
                test: createProjectConfig("integration"),
                resolve: {
                    alias: aliases,
                    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                },
            },
            {
                test: createProjectConfig("performance"),
                resolve: {
                    alias: aliases,
                    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                },
            },
            {
                test: createProjectConfig("interactions"),
                resolve: {
                    alias: aliases,
                    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                },
            },
        ],
    },
});
