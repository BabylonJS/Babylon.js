import type { Config } from "@jest/types";
import * as fs from "fs";
import * as path from "path";
import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";

// const t = Object.assign(ts_preset, puppeteer_preset);

const compilerOptions = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./tsconfig.json"), "utf8")).compilerOptions;

const stripAnyJsExtensionFound = (mappings: any): any => {
    const newMappings: any = {};
    for (const key in mappings) {
        // Remove the .js extension from the end if it is there
        newMappings[key.replace("(.*)$", "(.*?)(?:\\.js)?$")] = mappings[key];
    }
    return newMappings;
};

const createProject = (type: string) => {
    const setupFileLocation = path.resolve(".", `jest.${type}.setup.ts`);
    const setupFilesAfterEnvLocation = path.resolve(".", `jest.${type}.setup.afterEnv.ts`);
    const tsConfigPath = path.resolve(".", "tsconfig.json");
    const tsTestConfigPath = path.resolve(".", "tsconfig.test.json");
    const globalSetup = fs.existsSync(setupFileLocation) ? setupFileLocation : undefined;
    const setupFilesAfterEnv = fs.existsSync(setupFilesAfterEnvLocation) ? [setupFilesAfterEnvLocation] : undefined;
    const returnValue: Partial<JestConfigWithTsJest> = {
        displayName: {
            name: type,
            color: "yellow",
        },
        testRegex: [`/test/${type}/.*test\\.[tj]sx?$`],
        moduleNameMapper: {
            ...stripAnyJsExtensionFound(pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/packages/" })),
            // Remove .js from imports (for packages that include .js in the import paths)
            "^(.+)\\.js$": "$1",
        },
        roots: [path.resolve(".")],
        setupFilesAfterEnv: ["@alex_neo/jest-expect-message"],
        transform: {
            "^.+\\.tsx?$": [
                "ts-jest",
                {
                    isolatedModules: true,
                    useESM: true,
                    tsconfig: fs.existsSync(tsTestConfigPath) ? tsTestConfigPath : fs.existsSync(tsConfigPath) ? tsConfigPath : path.resolve(__dirname, "tsconfig.json"),
                },
            ],
        },
    };
    if (globalSetup) {
        returnValue.globalSetup = globalSetup;
    }
    if (setupFilesAfterEnv) {
        returnValue.setupFilesAfterEnv?.push(...setupFilesAfterEnv);
    }
    if (type === "unit") {
        return {
            ...returnValue,
            preset: "ts-jest/presets/default-esm", // if puppeteer is needed: "./" + path.relative(__dirname, path.resolve(__dirname, "./scripts/tsPuppeteer.js")),
            testEnvironment: "node",
            extensionsToTreatAsEsm: [".ts"],
        };
    } else if (type === "visualization") {
        return {
            ...returnValue,
            preset: "./" + path.relative(__dirname, path.resolve(__dirname, "./scripts/tsPuppeteer.js")),
            extensionsToTreatAsEsm: [".ts"],
        };
    } else if (type === "integration" || type === "performance") {
        // not yet used
        return {
            ...returnValue,
            // preset: "./" + path.relative(__dirname, path.resolve(__dirname, "./scripts/tsPuppeteer.js")),
            globalSetup: "jest-environment-puppeteer/setup",
            globalTeardown: "jest-environment-puppeteer/teardown",
            testEnvironment: "jest-environment-puppeteer",
            preset: "jest-puppeteer",
            extensionsToTreatAsEsm: [".ts"],
        };
    } else if (type === "interactions") {
        return {
            ...returnValue,
            preset: "ts-jest/presets/default-esm",
            testEnvironment: "node",
            extensionsToTreatAsEsm: [".ts"],
        };
    } else {
        return {};
    }
};

// Sync object
const config: Config.InitialOptions = {
    projects: [createProject("unit"), createProject("visualization"), createProject("integration"), createProject("performance"), createProject("interactions")],
    reporters: ["default", "./scripts/jest-imagediff-reporter", "jest-junit"],
};
export default config;
