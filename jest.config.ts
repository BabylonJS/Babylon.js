import type { Config } from "jest";
import * as fs from "fs";
import * as path from "path";
import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";

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
        testPathIgnorePatterns: ["/node_modules/", "/packages/.*/src/"],
        moduleNameMapper: {
            ...stripAnyJsExtensionFound(pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/packages/" })),
            // Remove .js from imports (for packages that include .js in the import paths)
            "^(.+)\\.js$": "$1",
        },
        roots: ["<rootDir>/packages"],
        setupFilesAfterEnv: ["@alex_neo/jest-expect-message"],
        transform: {
            "^.+\\.tsx?$": [
                "ts-jest",
                {
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
    if (type === "unit" || type === "integration" || type === "performance" || type === "interactions") {
        return {
            ...returnValue,
            preset: "ts-jest/presets/default",
            testEnvironment: "node",
        };
    } else {
        return {};
    }
};

// Sync object
const config: Config = {
    projects: [createProject("unit"), createProject("integration"), createProject("performance"), createProject("interactions")],
    reporters: ["default", "./scripts/jest-imagediff-reporter", "jest-junit"],
};
export default config;
