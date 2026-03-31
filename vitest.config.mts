import { defineConfig } from "vitest/config";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        // Use child processes (like Jest) instead of worker threads.
        // Babylon.js has deep side-effect import chains (shaders, scene
        // components) that resolve asynchronously. With the default 'threads'
        // pool, pending module resolution can outlive the test and cause
        // EnvironmentTeardownError. Forked processes exit cleanly.
        pool: "forks",
        globalSetup,
        setupFiles,
    };
};

export default defineConfig({
    resolve: {
        alias: {
            ...aliases,
        },
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    test: {
        globals: true,
        environment: "node",
        reporters: process.env.CI ? ["default", "junit"] : ["default"],
        outputFile: process.env.CI ? { junit: "./junit.xml" } : undefined,
        projects: [
            {
                test: createProjectConfig("unit"),
                resolve: {
                    alias: aliases,
                    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                },
            },
            // Integration, performance, and interactions tests require a browser
            // (Puppeteer/Playwright) and are run separately via Playwright configs.
            // They are not included here to avoid "page is not defined" errors.
        ],
    },
});
