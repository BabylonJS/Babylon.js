import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LoadConfig } from "../../../src/cli/config";

describe("Config Loader", () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = join(tmpdir(), `inspector-config-test-${Date.now()}`);
        mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    it("returns defaults when no config file exists", () => {
        const config = LoadConfig(tempDir);
        expect(config.browserPort).toBe(4400);
        expect(config.cliPort).toBe(4401);
    });

    it("reads config from .babyloninspector in the given directory", () => {
        writeFileSync(join(tempDir, ".babyloninspector"), JSON.stringify({ browserPort: 5500, cliPort: 5501 }));
        const config = LoadConfig(tempDir);
        expect(config.browserPort).toBe(5500);
        expect(config.cliPort).toBe(5501);
    });

    it("walks up parent directories to find config", () => {
        const childDir = join(tempDir, "a", "b", "c");
        mkdirSync(childDir, { recursive: true });
        writeFileSync(join(tempDir, ".babyloninspector"), JSON.stringify({ browserPort: 6600 }));
        const config = LoadConfig(childDir);
        expect(config.browserPort).toBe(6600);
        expect(config.cliPort).toBe(4401); // default
    });

    it("merges partial config with defaults", () => {
        writeFileSync(join(tempDir, ".babyloninspector"), JSON.stringify({ cliPort: 9999 }));
        const config = LoadConfig(tempDir);
        expect(config.browserPort).toBe(4400); // default
        expect(config.cliPort).toBe(9999);
    });

    it("returns defaults for malformed JSON", () => {
        writeFileSync(join(tempDir, ".babyloninspector"), "not valid json{{{");
        const config = LoadConfig(tempDir);
        expect(config.browserPort).toBe(4400);
        expect(config.cliPort).toBe(4401);
    });

    it("ignores non-numeric port values", () => {
        writeFileSync(join(tempDir, ".babyloninspector"), JSON.stringify({ browserPort: "abc", cliPort: true }));
        const config = LoadConfig(tempDir);
        expect(config.browserPort).toBe(4400);
        expect(config.cliPort).toBe(4401);
    });
});
