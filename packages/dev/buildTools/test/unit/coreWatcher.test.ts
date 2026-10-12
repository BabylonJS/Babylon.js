import { readFileSync } from "fs";
import { createRequire } from "module";
import * as path from "path";
import { runInNewContext } from "vm";
import { describe, expect, it, vi } from "vitest";

const Script = readFileSync(path.resolve("packages/public/@babylonjs/core/watcher.cjs"), "utf8");

describe("CommonJS core directory watcher", () => {
    it("loads the installed Chokidar ESM entry from the CommonJS watcher", () => {
        const require = createRequire(path.resolve("packages/public/@babylonjs/core/watcher.cjs"));
        expect(require("chokidar").watch).toBeTypeOf("function");
    });

    it("keeps its initial compilation and rebuilds only for TypeScript file events", () => {
        let onChange: (event: string, file: string) => void = () => {
            throw new Error("Watcher callback was not registered");
        };
        const watcher = {
            on: vi.fn((_event: string, callback: typeof onChange) => {
                onChange = callback;
                return watcher;
            }),
        };
        const watch = vi.fn(() => watcher);
        const exec = vi.fn((_command: string, callback: (error: null, stdout: string, stderr: string) => void) => callback(null, "", ""));
        runInNewContext(Script, {
            require: (name: string) => {
                if (name === "chokidar") {
                    return { watch };
                }
                if (name === "child_process") {
                    return { exec };
                }
                throw new Error(`Unexpected dependency: ${name}`);
            },
            console: { log: vi.fn() },
        });

        expect(watch).toHaveBeenCalledWith("../../../dev/core/src", expect.objectContaining({ ignoreInitial: true }));
        expect(exec).toHaveBeenCalledTimes(1);
        onChange("addDir", "src/nested");
        onChange("change", "src/ignored.json");
        expect(exec).toHaveBeenCalledTimes(1);
        onChange("add", "src/nested/new.ts");
        onChange("change", "src/nested/new.ts");
        onChange("unlink", "src/nested/new.ts");
        expect(exec).toHaveBeenCalledTimes(4);
        expect(exec).toHaveBeenLastCalledWith("npm run compile", expect.any(Function));
    });
});
