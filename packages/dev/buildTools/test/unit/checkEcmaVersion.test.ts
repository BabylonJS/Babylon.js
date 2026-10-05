import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawnSync } from "child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const Checker = path.resolve("scripts/checkEcmaVersion.mjs");

describe("ES2015 bundle syntax checker", () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bjs-escheck-"));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    const check = (args: string[]) => spawnSync(process.execPath, [Checker, ...args], { cwd: tempDir, encoding: "utf8" });
    const write = (name: string, source: string) => {
        const file = path.join(tempDir, name);
        fs.writeFileSync(file, source);
        return file;
    };

    it("accepts ES2015 syntax, including paths containing spaces", () => {
        const file = write("valid bundle.js", "const twice = (value) => value * 2; class Example {}");
        const result = check(["es6", file]);
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
    });

    it.each(["async function example() {}", "const value = object?.value;", "export const value = 1;", "const = ;"])("rejects incompatible script syntax: %s", (source) => {
        const file = write("invalid.js", source);
        const result = check(["es6", file]);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(file);
    });

    it("fails for missing input files", () => {
        const result = check(["es6", "missing.js"]);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("missing.js");
        expect(result.stderr).toContain("ENOENT");
    });

    it("checks all files and reports each failure", () => {
        const first = write("first.js", "const value = object?.value;");
        const second = write("second.js", "async function example() {}");
        const valid = write("valid.js", "const value = 1;");
        const result = check(["es6", first, valid, second]);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(first);
        expect(result.stderr).toContain(second);
    });

    it.each([{ args: [] }, { args: ["es6"] }, { args: ["es5", "unused.js"] }])("rejects invalid arguments: $args", ({ args }) => {
        const result = check(args);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Usage:");
    });
});
