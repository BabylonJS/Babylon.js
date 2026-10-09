import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawn } from "child_process";
import { watch } from "chokidar";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateDeclaration } from "../../src/generateDeclaration";
import { externalArgs } from "../../src/utils";

vi.mock("chokidar", async (importOriginal) => {
    const original = await importOriginal<typeof import("chokidar")>();
    return {
        ...original,
        watch: vi.fn((paths: Parameters<typeof original.watch>[0], options: Parameters<typeof original.watch>[1]) => original.watch(paths, { ...options, usePolling: true })),
    };
});
vi.mock("child_process", async (importOriginal) => {
    const original = await importOriginal<typeof import("child_process")>();
    return { ...original, spawn: vi.fn(() => new original.ChildProcess()) };
});

describe("declaration directory watchers", () => {
    let tempDir: string;
    let previousDirectory: string;
    let previousArgs: string[];

    beforeEach(() => {
        tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "bjs-declaration-watch-")));
        previousDirectory = process.cwd();
        previousArgs = externalArgs.splice(0);
        process.chdir(tempDir);
        fs.writeFileSync("package.json", JSON.stringify({ name: "@babylonjs/root" }));
        fs.mkdirSync("packages/fixture/dist", { recursive: true });
        fs.mkdirSync("packages/fixture/src", { recursive: true });
        fs.writeFileSync("packages/fixture/tsconfig.build.json", "{}");
        vi.spyOn(console, "log").mockImplementation(() => {});
        externalArgs.push(
            "--watch",
            "--json",
            "--config",
            JSON.stringify({
                devPackageName: "core",
                declarationLibs: ["@dev/core"],
                sourceDirectoryOverrides: { "@dev/core": "fixture" },
                outputDirectory: "combined",
            })
        );
    });

    afterEach(async () => {
        for (const result of vi.mocked(watch).mock.results) {
            if (result.type === "return") {
                await result.value.close();
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
        vi.mocked(watch).mockClear();
        vi.mocked(spawn).mockClear();
        vi.restoreAllMocks();
        externalArgs.splice(0, externalArgs.length, ...previousArgs);
        process.chdir(previousDirectory);
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("regenerates for initial, added, changed, removed and recreated declarations", async () => {
        fs.writeFileSync("packages/fixture/dist/initial.d.ts", "export declare class Initial {}");
        generateDeclaration();
        const output = () => fs.readFileSync("combined/index.d.ts", "utf8");
        await vi.waitFor(() => expect(output()).toContain("class Initial"), { timeout: 5000 });

        fs.mkdirSync("packages/fixture/dist/nested");
        fs.writeFileSync("packages/fixture/dist/nested/added.d.ts", "export declare class Added {}");
        fs.writeFileSync("packages/fixture/dist/nested/ignored.js", "invalid JavaScript");
        await vi.waitFor(() => expect(output()).toContain("class Added"), { timeout: 5000 });
        fs.writeFileSync("packages/fixture/dist/nested/added.d.ts", "export declare class Changed { value: number; }");
        await vi.waitFor(() => expect(output()).toContain("class Changed"), { timeout: 5000 });
        fs.unlinkSync("packages/fixture/dist/nested/added.d.ts");
        await vi.waitFor(() => expect(output()).not.toContain("class Changed"), { timeout: 5000 });
        fs.writeFileSync("packages/fixture/dist/nested/added.d.ts", "export declare class Changed { value: number; }");
        await vi.waitFor(() => expect(output()).toContain("class Changed"), { timeout: 5000 });
        expect(vi.mocked(watch).mock.calls[0][0]).toEqual([path.join(tempDir, "packages/fixture/dist")]);
    });

    it.each(["ts", "tsx"])(
        "rebuilds declaration inputs for added, changed and removed nested %s source events",
        async (extension) => {
            externalArgs.push("--watch-inputs");
            fs.mkdirSync("packages/fixture/src/nested");
            fs.writeFileSync(`packages/fixture/src/existing.${extension}`, "export class Existing {}");
            generateDeclaration();
            await Promise.all(
                vi.mocked(watch).mock.results.map((result) => (result.type === "return" ? new Promise<void>((resolve) => result.value.once("ready", resolve)) : Promise.resolve()))
            );
            expect(spawn).not.toHaveBeenCalled();
            const sourceWatcherResult = vi.mocked(watch).mock.results[1];
            if (sourceWatcherResult.type !== "return") {
                throw new Error("Source watcher was not created");
            }
            const sourceWatcher = sourceWatcherResult.value;
            const sourceWatcherOptions = vi.mocked(watch).mock.calls[1][1];
            expect(sourceWatcherOptions?.ignoreInitial).toBe(true);
            const ignored = sourceWatcherOptions?.ignored;
            if (typeof ignored !== "function") {
                throw new Error("Source watcher must use a file filter");
            }
            const fileStats = fs.statSync(`packages/fixture/src/existing.${extension}`);
            const sourceFile = path.join(tempDir, `packages/fixture/src/nested/new.${extension}`);
            expect(ignored(sourceFile, fileStats)).toBe(false);
            expect(ignored(path.join(tempDir, "packages/fixture/src/nested/ignored.json"), fileStats)).toBe(true);
            expect(ignored(path.join(tempDir, "packages/fixture/src/nested"), fs.statSync("packages/fixture/src/nested"))).toBe(false);

            const expectBuild = (count: number) => {
                expect(spawn).toHaveBeenCalledTimes(count);
                expect(spawn).toHaveBeenLastCalledWith(
                    "npx",
                    ["tsc", "-b", path.join("packages", "fixture", "tsconfig.build.json"), "--emitDeclarationOnly", "--pretty", "false"],
                    expect.anything()
                );
                const result = vi.mocked(spawn).mock.results[count - 1];
                if (result.type === "return") {
                    result.value.emit("close", 0);
                }
            };
            sourceWatcher.emit("all", "add", path.join(tempDir, "packages/fixture/src/nested/ignored.json"));
            sourceWatcher.emit("all", "addDir", sourceFile);
            expect(spawn).not.toHaveBeenCalled();
            // Test event handling independently of filesystem polling startup.
            sourceWatcher.emit("all", "add", sourceFile);
            expectBuild(1);
            sourceWatcher.emit("all", "change", sourceFile);
            expectBuild(2);
            sourceWatcher.emit("all", "unlink", sourceFile);
            expectBuild(3);
            expect(vi.mocked(watch).mock.calls[1][0]).toEqual([path.join(tempDir, "packages/fixture/src")]);
        },
        15000
    );
});
