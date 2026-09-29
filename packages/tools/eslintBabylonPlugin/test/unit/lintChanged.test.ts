import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { globSync } from "glob";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import lintStagedConfig from "../../../../../lint-staged.config.mjs";
import { isLintFile, LintFiles, LintSourceFiles, LintTestFiles } from "../../../../../scripts/lint-globs.mjs";
import { parseArguments, requiresFullLint, runChangedLint, runStagedLint, splitNullDelimited } from "../../../../../scripts/lint-changed.mjs";
import { chunkFileArguments, completeChildProcess, runFullLint } from "../../../../../scripts/lint.mjs";

const RepoRoot = path.resolve(import.meta.dirname, "../../../../..");
const PluginBuildConfigFiles = [
    "packages/tools/eslintBabylonPlugin/package.json",
    "packages/tools/eslintBabylonPlugin/tsconfig.json",
    "packages/tools/eslintBabylonPlugin/tsconfig.build.json",
    "packages/tools/eslintBabylonPlugin/tsconfig.future.json",
    "tsconfig.build.json",
];
let fixtureRoot: string | undefined;

const writeFixture = (file: string, contents: string) => {
    const absolutePath = path.join(fixtureRoot!, file);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents);
};

const git = (...args: string[]) => execFileSync("git", args, { cwd: fixtureRoot, encoding: "utf8" });

const initializeRepository = () => {
    fixtureRoot = mkdtempSync(path.join(import.meta.dirname, ".lint-changed-test-repo-"));
    git("init", "--quiet");
    git("config", "user.email", "lint-test@example.com");
    git("config", "user.name", "Lint Test");

    for (const file of ["packages/a/src/staged.ts", "packages/a/src/work tree.ts", "packages/a/src/deleted.ts", "packages/a/src/-leading.ts"]) {
        writeFixture(file, "export const value = 1;\n");
    }
    writeFixture("packages/a/other.ts", "export const ignored = true;\n");
    writeFixture("packages/a/tsconfig.json", "{}\n");
    git("add", ".");
    git("commit", "--quiet", "-m", "fixture");
};

afterEach(() => {
    if (fixtureRoot) {
        rmSync(fixtureRoot, { recursive: true, force: true });
        fixtureRoot = undefined;
    }
});

describe("lint scopes", () => {
    it("exports the shared source and test globs", () => {
        expect(LintSourceFiles).toEqual(["packages/**/src/**/*.{ts,tsx,js}"]);
        expect(LintTestFiles).toEqual(["packages/**/test/**/*.{test,spec}.{ts,tsx,js}"]);
        expect(LintFiles).toEqual([...LintSourceFiles, ...LintTestFiles]);
    });

    it.each([
        ["packages/dev/core/src/index.ts", true],
        ["packages/src/file.ts", true],
        ["packages/test/file.test.ts", true],
        ["packages/a/src/nested/file.js", true],
        ["packages/parent\nfolder/src/nested\nfolder/file.js", true],
        ["packages/a/test/file.test.ts", true],
        ["packages/a/test/nested/file.spec.tsx", true],
        ["packages/a/test/file.ts", false],
        ["packages/a/tests/file.test.ts", false],
        ["packages/a/index.ts", false],
        ["packages/a/src/file.json", false],
        ["packages/a/src/file.ts\n", false],
    ])("matches %s precisely", (file, expected) => {
        expect(isLintFile(file)).toBe(expected);
    });
});

describe("changed lint arguments", () => {
    it("parses fix and base in either order", () => {
        expect(parseArguments(["--fix", "--base", "main"])).toEqual({ baseRef: "main", fix: true });
        expect(parseArguments(["--base", "main", "--fix"])).toEqual({ baseRef: "main", fix: true });
        expect(parseArguments([])).toEqual({ baseRef: "origin/master", fix: false });
    });

    it.each([
        [["--base"], "--base requires a ref."],
        [["--base", "--fix"], "--base requires a ref."],
        [["--unknown"], "Unknown argument: --unknown"],
        [["--fix", "--fix"], "--fix may only be specified once."],
        [["--base", "main", "--base", "other"], "--base may only be specified once."],
    ])("rejects invalid arguments", (args, message) => {
        expect(() => parseArguments(args)).toThrow(message);
    });

    it("returns a CLI error for an unknown argument", () => {
        const result = spawnSync(process.execPath, [path.join(RepoRoot, "scripts/lint-changed.mjs"), "--unknown"], { encoding: "utf8" });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Unknown argument: --unknown");
    });

    it("parses NUL-delimited filenames without treating newlines as separators", () => {
        expect(splitNullDelimited("space name.ts\0line\nbreak.ts\0unicode-λ.ts\0")).toEqual(["space name.ts", "line\nbreak.ts", "unicode-λ.ts"]);
    });
});

describe("changed lint execution", () => {
    it("includes staged, worktree, and untracked files while excluding deletions and out-of-scope files", () => {
        initializeRepository();
        writeFixture("packages/a/src/staged.ts", "export const value = 2;\n");
        git("add", "packages/a/src/staged.ts");
        writeFixture("packages/a/src/work tree.ts", "export const value = 2;\n");
        writeFixture("packages/a/src/-leading.ts", "export const value = 2;\n");
        rmSync(path.join(fixtureRoot!, "packages/a/src/deleted.ts"));
        writeFixture("packages/a/src/unicode-λ file.ts", "export const value = 1;\n");
        if (process.platform !== "win32") {
            writeFixture("packages/a/src/newline\nfile.ts", "export const value = 1;\n");
        }
        writeFixture("packages/a/test/new file.test.ts", "it('works', () => {});\n");
        writeFixture("packages/a/test/not-a-test.ts", "export {};\n");
        writeFixture("packages/a/loose.ts", "export {};\n");

        const calls: { command: string; args: string[] }[] = [];
        const result = runChangedLint(["--base", "HEAD"], {
            cwd: fixtureRoot,
            eslintPath: "local-eslint.js",
            log: () => {},
            spawnSyncImpl: (command: string, args: string[]) => {
                calls.push({ command, args });
                return { status: 0, signal: null };
            },
        });

        expect(result.status).toBe(0);
        expect(calls).toHaveLength(1);
        expect(calls[0].command).toBe(process.execPath);
        expect(calls[0].args.slice(0, 5)).toEqual(["local-eslint.js", "--quiet", "--no-warn-ignored", "--cache", "--"]);
        expect(calls[0].args.slice(5)).toEqual([
            "packages/a/src/-leading.ts",
            "packages/a/src/staged.ts",
            "packages/a/src/work tree.ts",
            ...(process.platform === "win32" ? [] : ["packages/a/src/newline\nfile.ts"]),
            "packages/a/src/unicode-λ file.ts",
            "packages/a/test/new file.test.ts",
        ]);
        expect(calls[0].args).not.toContain("packages/a/src/deleted.ts");
    }, 30_000);

    it("rebuilds changed plugin sources and runs all scopes without cache", () => {
        const calls: string[][] = [];
        runChangedLint(["--base", "HEAD", "--fix"], {
            eslintPath: "local-eslint.js",
            typescriptPath: "local-tsc.js",
            log: () => {},
            execFileSyncImpl: (_command: string, args: string[]) => {
                if (args[0] === "merge-base") {
                    return "base\n";
                }
                if (args[0] === "diff") {
                    return args.includes("--diff-filter=ACMRTUXB") ? "" : "packages/tools/eslintBabylonPlugin/src/deletedRule.ts\0";
                }
                return "";
            },
            spawnSyncImpl: (_command: string, args: string[]) => {
                calls.push(args);
                return { status: 0, signal: null };
            },
        });

        expect(calls).toEqual([
            ["local-tsc.js", "-b", "packages/tools/eslintBabylonPlugin/tsconfig.build.json"],
            ["local-eslint.js", "--quiet", "--no-warn-ignored", "--no-cache", "--fix", "--", ...LintFiles],
        ]);
    });

    it("runs an uncached full lint when a deleted package config changes", () => {
        const calls: string[][] = [];
        runChangedLint(["--base", "HEAD"], {
            eslintPath: "local-eslint.js",
            log: () => {},
            execFileSyncImpl: (_command: string, args: string[]) => {
                if (args[0] === "merge-base") {
                    return "base\n";
                }
                if (args[0] === "diff") {
                    return args.includes("--diff-filter=ACMRTUXB") ? "" : "packages/dev/core/tsconfig.json\0";
                }
                return "";
            },
            spawnSyncImpl: (_command: string, args: string[]) => {
                calls.push(args);
                return { status: 0, signal: null };
            },
        });

        expect(calls).toEqual([["local-eslint.js", "--quiet", "--no-warn-ignored", "--no-cache", "--", ...LintFiles]]);
    });

    it("runs an uncached full lint when a package config is renamed to a non-trigger filename", () => {
        initializeRepository();
        git("mv", "packages/a/tsconfig.json", "packages/a/config.json");

        const calls: string[][] = [];
        runChangedLint(["--base", "HEAD"], {
            cwd: fixtureRoot,
            eslintPath: "local-eslint.js",
            log: () => {},
            spawnSyncImpl: (_command: string, args: string[]) => {
                calls.push(args);
                return { status: 0, signal: null };
            },
        });

        expect(calls).toEqual([["local-eslint.js", "--quiet", "--no-warn-ignored", "--no-cache", "--", ...LintFiles]]);
    });

    it.each([
        "eslint.config.mjs",
        "lint-staged.config.mjs",
        "package.json",
        "package-lock.json",
        "scripts/format.mjs",
        "tsconfig.test.json",
        "packages/dev/core/package.json",
        "packages/dev/core/tsconfig.build.json",
        "packages/dev/core/tsdoc.json",
        "scripts/lint.mjs",
        "scripts/lint-globs.mjs",
        "scripts/lint-changed.mjs",
        "tsdoc.json",
        ...PluginBuildConfigFiles,
        "packages/tools/eslintBabylonPlugin/src/nested\nfolder/rule.ts",
        "scripts/treeshaking/side-effects-manifest/core/rendering.json",
        "scripts/treeshaking/side-effects-manifest.json",
    ])("treats %s as a full-lint trigger", (file) => {
        expect(requiresFullLint(file)).toBe(true);
    });
});

describe("staged lint execution", () => {
    it("uses one staged batch for source and test files without broadening the test scope", () => {
        fixtureRoot = mkdtempSync(path.join(import.meta.dirname, ".lint-changed-test-repo-"));
        const files = ["packages/a/src/source.ts", "packages/a/src/nested/source.js", "packages/a/test/nested/check.test.ts", "packages/a/test/check.spec.tsx"];
        for (const file of [...files, "packages/a/test/helper.ts", "packages/a/src/fixture.json"]) {
            writeFixture(file, "");
        }
        const patterns = Object.keys(lintStagedConfig).filter((pattern) => Array.isArray(lintStagedConfig[pattern]));
        expect(patterns).toHaveLength(1);
        expect(
            globSync(patterns, { cwd: fixtureRoot })
                .map((file) => file.replace(/\\/g, "/"))
                .sort()
        ).toEqual(files.sort());
        expect(lintStagedConfig[patterns[0]]).toEqual(["prettier --write", "node scripts/lint-changed.mjs --staged"]);
        const formatOnlyCommands = Object.values(lintStagedConfig).filter((commands) => typeof commands === "string");
        expect(formatOnlyCommands.length).toBeGreaterThan(0);
        expect(new Set(formatOnlyCommands)).toEqual(new Set(["prettier --write"]));
    });

    it("rebuilds staged plugin sources before uncached lint of every source and test file", () => {
        const calls: string[][] = [];
        runStagedLint([path.join(RepoRoot, "packages/tools/eslintBabylonPlugin/src/index.ts"), path.join(RepoRoot, "packages/a/test/check.test.ts")], {
            cwd: RepoRoot,
            eslintPath: "local-eslint.js",
            typescriptPath: "local-tsc.js",
            log: () => {},
            spawnSyncImpl: (_command: string, args: string[]) => {
                calls.push(args);
                return { status: 0, signal: null };
            },
        });
        expect(calls).toEqual([
            ["local-tsc.js", "-b", "packages/tools/eslintBabylonPlugin/tsconfig.build.json"],
            ["local-eslint.js", "--quiet", "--no-warn-ignored", "--no-cache", "--", ...LintFiles],
        ]);
    });

    it("stops when the plugin build fails rather than using stale rules", () => {
        const spawn = vi.fn(() => ({ status: 2, signal: null }));
        const result = runStagedLint(["packages/tools/eslintBabylonPlugin/src/index.ts"], {
            cwd: RepoRoot,
            typescriptPath: "local-tsc.js",
            spawnSyncImpl: spawn,
            log: () => {},
        });
        expect(result.status).toBe(2);
        expect(spawn).toHaveBeenCalledTimes(1);
    });

    it.each(PluginBuildConfigFiles)("rebuilds for staged plugin build config %s before uncached full lint", (file) => {
        const calls: string[][] = [];
        runStagedLint([file], {
            cwd: RepoRoot,
            eslintPath: "local-eslint.js",
            typescriptPath: "local-tsc.js",
            log: () => {},
            spawnSyncImpl: (_command: string, args: string[]) => {
                calls.push(args);
                return { status: 0, signal: null };
            },
        });
        expect(calls).toEqual([
            ["local-tsc.js", "-b", "packages/tools/eslintBabylonPlugin/tsconfig.build.json"],
            ["local-eslint.js", "--quiet", "--no-warn-ignored", "--no-cache", "--", ...LintFiles],
        ]);
    });

    it.each(PluginBuildConfigFiles)("stops after a failed rebuild for staged plugin build config %s", (file) => {
        const spawn = vi.fn(() => ({ status: 2, signal: null }));
        const result = runStagedLint([file], {
            cwd: RepoRoot,
            typescriptPath: "local-tsc.js",
            spawnSyncImpl: spawn,
            log: () => {},
        });
        expect(result.status).toBe(2);
        expect(spawn).toHaveBeenCalledTimes(1);
    });

    it.each(["lint-staged.config.mjs", "scripts/format.mjs"])("runs uncached full lint without rebuilding the plugin for %s", (file) => {
        const calls: string[][] = [];
        runStagedLint([file], {
            cwd: RepoRoot,
            eslintPath: "local-eslint.js",
            log: () => {},
            spawnSyncImpl: (_command: string, args: string[]) => {
                calls.push(args);
                return { status: 0, signal: null };
            },
        });
        expect(calls).toEqual([["local-eslint.js", "--quiet", "--no-warn-ignored", "--no-cache", "--", ...LintFiles]]);
    });

    it("lints only the supplied ordinary files and preserves unusual filenames", () => {
        const calls: string[][] = [];
        const file = "packages/a/src/name with space\nand-λ.ts";
        runStagedLint([path.join(RepoRoot, file), file], {
            cwd: RepoRoot,
            eslintPath: "local-eslint.js",
            log: () => {},
            spawnSyncImpl: (_command: string, args: string[]) => {
                calls.push(args);
                return { status: 0, signal: null };
            },
        });
        expect(calls).toEqual([["local-eslint.js", "--quiet", "--no-warn-ignored", "--cache", "--", file]]);
    });

    it.each([{ args: [] }, { args: ["--fix"] }])("rejects invalid staged arguments: $args", ({ args }) => {
        const result = spawnSync(process.execPath, [path.join(RepoRoot, "scripts/lint-changed.mjs"), "--staged", ...args], { encoding: "utf8" });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("--staged requires file paths");
    });
});

describe("full lint wrapper", () => {
    it("passes flags to local ESLint with all scopes and no implicit cache", () => {
        const calls: string[][] = [];
        const result = runFullLint(["--quiet", "--format", "azure-devops"], {
            eslintPath: "local-eslint.js",
            spawnSyncImpl: (_command: string, args: string[]) => {
                calls.push(args);
                return { status: 0, signal: null };
            },
        });

        expect(result.status).toBe(0);
        expect(calls).toEqual([["local-eslint.js", "--quiet", "--format", "azure-devops", "--", ...LintFiles]]);
    });

    it("chunks long file lists without dropping arguments", () => {
        expect(chunkFileArguments(["one.ts", "two.ts", "three.ts"], ["eslint", "--"], 22)).toEqual([["one.ts"], ["two.ts"], ["three.ts"]]);
    });

    it("preserves child exit status, signal, and errors", () => {
        const processObject = { exitCode: undefined as number | undefined, kill: vi.fn(), pid: 42 };
        completeChildProcess({ status: 7, signal: null }, processObject);
        expect(processObject.exitCode).toBe(7);

        completeChildProcess({ status: null, signal: "SIGTERM" }, processObject);
        expect(processObject.kill).toHaveBeenCalledWith(42, "SIGTERM");

        const error = new Error("spawn failed");
        expect(() => completeChildProcess({ status: null, signal: null, error }, processObject)).toThrow(error);
    });
});
