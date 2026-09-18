import { ESLint } from "eslint";
import { spawnSync, type SpawnSyncOptions } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { runFormat } from "../../../../../scripts/format.mjs";
import { FormatFiles, FormatOnlyFiles, LintFiles } from "../../../../../scripts/lint-globs.mjs";
import stagedConfig from "../../../../../lint-staged.config.mjs";

const RepoRoot = fileURLToPath(new URL("../../../../../", import.meta.url));
const SourceFile = "packages/dev/core/src/Misc/logger.ts";

describe("repository formatting configuration", () => {
    it("shares source, test-code, and JSON scopes across local commands, CI, and pre-commit", () => {
        expect(FormatFiles).toEqual([...LintFiles, ...FormatOnlyFiles]);
        const commands = JSON.parse(readFileSync(path.join(RepoRoot, "package.json"), "utf8")).scripts;
        expect(commands["format:check"]).toBe("node scripts/format.mjs --check");
        expect(commands["format:fix"]).toBe("node scripts/format.mjs --write");
        expect(readFileSync(path.join(RepoRoot, ".azure-pipelines/ci-monorepo.yml"), "utf8")).toContain("- script: npm run format:check");
        for (const pattern of FormatOnlyFiles) {
            expect(stagedConfig[pattern]).toBe("prettier --write");
        }
    });

    it("detects and fixes unformatted test code and test JSON through the full formatting command", () => {
        const cwd = mkdtempSync(path.join(import.meta.dirname, ".format-fixture-"));
        try {
            for (const [file, content] of [
                ["packages/a/src/source.ts", "export const Value = 1;\n"],
                ["packages/a/src/data.json", "{}\n"],
                ["packages/a/test/unit/example.test.ts", 'it("works",()=>{expect(1).toBe(1)})'],
                ["packages/a/test/fixtures/data.json", '{"value":1}'],
            ]) {
                const fullPath = path.join(cwd, file);
                mkdirSync(path.dirname(fullPath), { recursive: true });
                writeFileSync(fullPath, content);
            }
            const options = {
                cwd,
                spawnSyncImpl: (command: string, args: string[], spawnOptions: SpawnSyncOptions) => spawnSync(command, args, { ...spawnOptions, encoding: "utf8", stdio: "pipe" }),
            };
            const check = runFormat(["--check"], options);
            expect(check.status).toBe(1);
            expect(check.stderr).toContain("example.test.ts");
            expect(check.stderr.replaceAll("\\", "/")).toContain("test/fixtures/data.json");
            expect(runFormat(["--write"], options).status).toBe(0);
            expect(runFormat(["--check"], options).status).toBe(0);
        } finally {
            rmSync(cwd, { recursive: true, force: true });
        }
    });
});

describe("repository lint configuration", () => {
    const eslint = new ESLint({
        cwd: RepoRoot,
        ruleFilter: ({ severity }) => severity === 2,
    });

    beforeAll(async () => {
        // Initializing the production TypeScript project service is slower than individual probes.
        await eslint.lintText("", { filePath: SourceFile });
    }, 60000);

    it("keeps formatting and Vitest rules out of production source", async () => {
        const config = await eslint.calculateConfigForFile(SourceFile);
        expect(config.rules["prettier/prettier"]).toBeUndefined();
        expect(config.rules["import/no-internal-modules"]).toBeUndefined();
        expect(Object.keys(config.rules).filter((rule) => rule.startsWith("vitest/"))).toEqual([]);
        expect(config.languageOptions.parserOptions.projectService).toBe(true);
    });

    it("preserves required braces after the Prettier override", async () => {
        const [result] = await eslint.lintText("export function Clamp(value: number): number { if (value < 0) return 0; return value; }", { filePath: SourceFile });
        expect(result.messages.map((message) => message.ruleId)).toContain("curly");
        const testConfig = await eslint.calculateConfigForFile("packages/dev/core/test/unit/Misc/observable.test.ts");
        expect(testConfig.rules.curly[0]).toBe(0);
    });

    it("enforces focused tests and valid assertions without production type-service costs", async () => {
        const filePath = "packages/dev/core/test/unit/Misc/observable.test.ts";
        const config = await eslint.calculateConfigForFile(filePath);
        expect(config.languageOptions.parserOptions.projectService).not.toBe(true);
        expect(config.languageOptions.globals.expect).toBeDefined();
        expect(config.rules["vitest/valid-expect"][0]).toBe(2);
        expect(config.rules["babylonjs/no-directory-barrel-imports"]).toBeUndefined();

        const [result] = await eslint.lintText('test.only("focused", () => { expect(true).toBe(true); });', { filePath });
        expect(result.messages.map((message) => message.ruleId)).toContain("vitest/no-focused-tests");
        expect(result.messages.map((message) => message.ruleId)).not.toContain("no-undef");
    });

    it("lints browser tests without applying Vitest rules", async () => {
        const filePath = "packages/tools/tests/test/visualization/visualization.webgl2.test.ts";
        expect(await eslint.isPathIgnored(filePath)).toBe(false);
        const config = await eslint.calculateConfigForFile(filePath);
        expect(Object.keys(config.rules).filter((rule) => rule.startsWith("vitest/"))).toEqual([]);
    });

    it("keeps smoke fixtures syntax-only and excludes generated and non-JavaScript files", async () => {
        const config = await eslint.calculateConfigForFile("packages/tools/tests/src/engineOnly.ts");
        expect(config.languageOptions.parserOptions.projectService).not.toBe(true);
        expect(config.rules["@typescript-eslint/naming-convention"]).toBeUndefined();
        const visualFixture = await eslint.calculateConfigForFile("packages/tools/tests/es6Vis/src/bootstrap.ts");
        expect(visualFixture.languageOptions.parserOptions.projectService).not.toBe(true);
        expect(visualFixture.rules["@typescript-eslint/naming-convention"]).toBeUndefined();
        expect(await eslint.isPathIgnored("packages/dev/core/src/Shaders/default.vertex.ts")).toBe(true);
        expect(await eslint.isPathIgnored("packages/dev/smartFilterBlocks/src/blocks/babylon/demo/effects/contrastBlock.block.ts")).toBe(true);
        expect(await eslint.isPathIgnored("packages/tools/devHost/src/flowgraph/babylonBrosFlowGraph.json")).toBe(true);
    });

    it("preserves blocking PURE checks while introducing nested candidates as advisory", async () => {
        const config = await eslint.calculateConfigForFile("packages/dev/core/src/scene.pure.ts");
        expect(config.rules["babylonjs/require-pure-annotation"][0]).toBe(2);
        expect(config.rules["babylonjs/require-nested-pure-annotation"][0]).toBe(1);
    });

    it("reports exported PURE initializers exactly once as advisory without autofixes", async () => {
        const pureLint = new ESLint({
            cwd: RepoRoot,
            ruleFilter: ({ ruleId }) => ruleId === "babylonjs/require-pure-annotation" || ruleId === "babylonjs/require-nested-pure-annotation",
        });
        const [result] = await pureLint.lintText("export const Value = new Widget();", { filePath: "packages/dev/core/src/scene.pure.ts" });
        expect(result.messages).toEqual([expect.objectContaining({ ruleId: "babylonjs/require-nested-pure-annotation", severity: 1 })]);
        expect(result.messages[0].fix).toBeUndefined();
    });

    it.each([
        ["no-loss-of-precision", "export const LargeNumber = 9007199254740993;"],
        ["no-fallthrough", "export function Classify(value: number): number { switch (value) { case 0: value++; case 1: return value; default: return value; } }"],
        ["no-async-promise-executor", "export const Task = new Promise<void>(async (resolve) => { await Promise.resolve(); resolve(); });"],
        ["@typescript-eslint/no-misused-promises", "export async function ProbeAsync(): Promise<void> { const task = Promise.resolve(false); if (task) { await task; } }"],
    ])("enforces %s even when warning rules are filtered out", async (rule, source) => {
        const [result] = await eslint.lintText(source, { filePath: SourceFile });
        expect(result.messages.map((message) => message.ruleId)).toContain(rule);
    });

    it("runs sparse-array policies in advisory linting", async () => {
        const advisory = new ESLint({
            cwd: RepoRoot,
            ruleFilter: ({ ruleId }) => ruleId === "@typescript-eslint/no-array-delete",
        });
        const [result] = await advisory.lintText("export const Items = [1, 2, 3]; delete Items[1];", { filePath: SourceFile });
        expect(result.messages).toEqual([expect.objectContaining({ ruleId: "@typescript-eslint/no-array-delete", severity: 1 })]);
    });

    it("allows testing whether an optional promise exists", async () => {
        const [result] = await eslint.lintText("export async function ProbeAsync(task?: Promise<boolean>): Promise<void> { if (task) { await task; } }", {
            filePath: SourceFile,
        });
        expect(result.errorCount).toBe(0);
    });

    it.each([
        ['import { Logger } from "core/Misc/";', "@typescript-eslint/no-restricted-imports"],
        ['import type { Logger } from "core/Misc/";', "@typescript-eslint/no-restricted-imports"],
        ['export { Logger } from "core/Misc/";', "@typescript-eslint/no-restricted-imports"],
        ['export async function LoadAsync() { return await import("core/Misc/"); }', "no-restricted-syntax"],
        ['export const Module = require("core/Misc/");', "no-restricted-syntax"],
        ['import Module = require("core/Misc/"); export { Module };', "no-restricted-syntax"],
    ])("rejects trailing-slash module paths: %s", async (source, rule) => {
        const [result] = await eslint.lintText(source, { filePath: SourceFile });
        expect(result.messages.map((message) => message.ruleId)).toContain(rule);
    });

    it("preserves type-only index imports", async () => {
        const [result] = await eslint.lintText('import type { Logger } from "./index"; export type { Logger };', { filePath: SourceFile });
        expect(result.messages.map((message) => message.ruleId)).not.toContain("@typescript-eslint/no-restricted-imports");
    });

    it("allows ordinary explicit module imports", async () => {
        const [result] = await eslint.lintText('export { Logger } from "core/Misc/logger";', { filePath: SourceFile });
        expect(result.messages.map((message) => message.ruleId)).not.toContain("@typescript-eslint/no-restricted-imports");
        expect(result.messages.map((message) => message.ruleId)).not.toContain("no-restricted-syntax");
    });

    it("also rejects index imports in JavaScript", async () => {
        const [result] = await eslint.lintText('import { Logger } from "./index"; export { Logger };', {
            filePath: "packages/tools/devHost/src/testScene/createSceneJS.js",
        });
        expect(result.messages.map((message) => message.ruleId)).toContain("no-restricted-imports");
    });

    it.each([
        'export async function LoadAsync() { return await import("./index"); }',
        'export const Module = require("./index");',
        'import Module = require("./index"); export { Module };',
    ])("rejects runtime index imports: %s", async (source) => {
        const [result] = await eslint.lintText(source, { filePath: SourceFile });
        expect(result.messages.map((message) => message.ruleId)).toContain("no-restricted-syntax");
    });
});
