import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { ResolveInlineOrFileText, WriteTextFileEnsuringDirectory } from "../../src/index";

describe("text handoff helpers", () => {
    it("returns inline text when only inline text is provided", () => {
        const result = ResolveInlineOrFileText({
            inlineText: "hello",
            inlineLabel: "json",
            fileLabel: "jsonFile",
        });

        expect(result).toEqual({ text: "hello", source: "inline" });
    });

    it("reads text from a file when only filePath is provided", () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-core-"));
        const filePath = path.join(tempDir, "input.json");
        fs.writeFileSync(filePath, "from-file", "utf-8");

        const result = ResolveInlineOrFileText({
            filePath,
            inlineLabel: "json",
            fileLabel: "jsonFile",
            fileDescription: "JSON file",
        });

        expect(result).toEqual({ text: "from-file", source: "file" });
    });

    it("throws when both inline text and filePath are provided", () => {
        expect(() =>
            ResolveInlineOrFileText({
                inlineText: "hello",
                filePath: "/tmp/file.json",
                inlineLabel: "json",
                fileLabel: "jsonFile",
            })
        ).toThrow("Provide either json or jsonFile, not both.");
    });

    it("throws when neither inline text nor filePath is provided", () => {
        expect(() =>
            ResolveInlineOrFileText({
                inlineLabel: "json",
                fileLabel: "jsonFile",
            })
        ).toThrow("Either json or jsonFile must be provided.");
    });

    it("throws a descriptive read error for missing files", () => {
        expect(() =>
            ResolveInlineOrFileText({
                filePath: "/definitely/missing.json",
                inlineLabel: "json",
                fileLabel: "jsonFile",
                fileDescription: "JSON file",
            })
        ).toThrow(/Error reading JSON file:/);
    });

    it("writes text and creates parent directories", () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-core-write-"));
        const nestedFilePath = path.join(tempDir, "nested", "deeper", "output.json");

        WriteTextFileEnsuringDirectory(nestedFilePath, "saved-content");

        expect(fs.readFileSync(nestedFilePath, "utf-8")).toBe("saved-content");
    });
});
