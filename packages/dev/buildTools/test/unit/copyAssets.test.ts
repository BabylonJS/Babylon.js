import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { watch } from "chokidar";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { processAssets } from "../../src/copyAssets";
import { externalArgs } from "../../src/utils";

vi.mock("chokidar", async (importOriginal) => {
    const original = await importOriginal<typeof import("chokidar")>();
    return { ...original, watch: vi.fn(original.watch) };
});

describe("asset directory watchers", () => {
    let tempDir: string;
    let previousDirectory: string;
    let previousArgs: string[];

    beforeEach(() => {
        tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "bjs-asset-watch-")));
        previousDirectory = process.cwd();
        previousArgs = externalArgs.splice(0);
        process.chdir(tempDir);
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(async () => {
        for (const result of vi.mocked(watch).mock.results) {
            if (result.type === "return") {
                await result.value.close();
            }
        }
        vi.mocked(watch).mockClear();
        vi.restoreAllMocks();
        externalArgs.splice(0, externalArgs.length, ...previousArgs);
        process.chdir(previousDirectory);
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it.each([
        { global: false, prefix: "" },
        { global: false, prefix: "input folder/" },
        { global: true, prefix: "packages/dev/example/" },
    ])(
        "copies initial and newly added nested assets without watching globs (global: $global, prefix: $prefix)",
        async ({ global, prefix }) => {
            const src = `${prefix}src`;
            const dist = global ? `${prefix}dist` : "dist";
            fs.mkdirSync(src, { recursive: true });
            fs.writeFileSync(`${src}/existing.json`, '{"initial":true}');
            externalArgs.push("--watch");
            if (global) {
                externalArgs.push("--global");
                fs.mkdirSync("packages/dev/other", { recursive: true });
                fs.writeFileSync("packages/dev/other/package.json", "{}");
            } else if (prefix) {
                externalArgs.push("--path-prefix", prefix);
            }

            processAssets({ extensions: ["json"] });

            await vi.waitFor(() => expect(fs.readFileSync(`${dist}/existing.json`, "utf8")).toBe('{"initial":true}'), { timeout: 5000 });
            fs.mkdirSync(`${src}/nested`, { recursive: true });
            fs.writeFileSync(`${src}/nested/new.json`, '{"added":true}');
            fs.writeFileSync(`${src}/nested/ignored.ts`, "const value = 1;");
            await vi.waitFor(() => expect(fs.readFileSync(`${dist}/nested/new.json`, "utf8")).toBe('{"added":true}'), { timeout: 5000 });

            fs.writeFileSync(`${src}/nested/new.json`, '{"changed":true}');
            await vi.waitFor(() => expect(fs.readFileSync(`${dist}/nested/new.json`, "utf8")).toBe('{"changed":true}'), { timeout: 5000 });
            expect(fs.existsSync(`${dist}/nested/ignored.ts`)).toBe(false);
            expect(vi.mocked(watch).mock.calls[0][0]).toBe(global ? "./packages" : src);
            if (global) {
                expect(fs.existsSync("packages/dev/other/dist/package.json")).toBe(false);
                fs.mkdirSync("packages/dev/other/src", { recursive: true });
                fs.writeFileSync("packages/dev/other/src/new.json", "{}");
                await vi.waitFor(() => expect(fs.readFileSync("packages/dev/other/dist/new.json", "utf8")).toBe("{}"), { timeout: 5000 });
            }
        },
        15000
    );

    it.each([
        ["add", "input folder/"],
        ["change", "input folder/"],
        ["add", "input folder\\"],
        ["change", "input folder\\"],
    ] as const)("copies prefixed assets from Windows-style %s events with prefix %s", (event, prefix) => {
        fs.mkdirSync("input folder/src", { recursive: true });
        fs.writeFileSync("input folder/src/existing.json", '{"initial":true}');
        externalArgs.push("--watch", "--path-prefix", prefix);

        processAssets({ extensions: ["json"] });

        const watcherResult = vi.mocked(watch).mock.results[0];
        if (watcherResult.type !== "return") {
            throw new Error("Expected the asset watcher to start");
        }
        watcherResult.value.emit("all", event, "input folder\\src\\existing.json");

        expect(fs.readFileSync("dist/existing.json", "utf8")).toBe('{"initial":true}');
    });
});
