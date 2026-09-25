import { describe, it, expect } from "vitest";
import { ShaderCodeCursor } from "core/Engines/Processors/shaderCodeCursor";

function cursorLines(source: string): string[] {
    const cursor = new ShaderCodeCursor();
    cursor.lines = source.split("\n");
    const lines: string[] = [];
    for (cursor.lineIndex = 0; cursor.currentLine !== undefined; cursor.lineIndex++) {
        lines.push(cursor.currentLine);
    }
    return lines;
}

describe("ShaderCodeCursor", () => {
    it("keeps both semicolons of an empty for loop header", () => {
        expect(cursorLines("for (;;) {")).toEqual(["for (;;", ") {"]);
    });

    it("keeps the semicolon of an empty condition in a for loop header", () => {
        expect(cursorLines("for (int i = 0;; i++) {")).toEqual(["for (int i = 0;;", "i++) {"]);
    });

    it("keeps a for loop header with an empty increment", () => {
        expect(cursorLines("for (int i = 0; i < 10;) {")).toEqual(["for (int i = 0;", "i < 10;", ") {"]);
    });

    it("keeps the empty clauses after a braced initializer", () => {
        expect(cursorLines("for (vec2 v = {0.0, 0.0};;) {}")).toEqual(["for (vec2 v = {0.0, 0.0};;", ") {}"]);
    });

    it("ignores parentheses in comments", () => {
        expect(cursorLines("for (/* ) */;;) {")).toEqual(["for (/* ) */;;", ") {"]);
        expect(cursorLines("float a = 1.0; /* ( */;; float b = 2.0;")).toEqual(["float a = 1.0;", "/* ( */;", "float b = 2.0;"]);
        expect(cursorLines("float a = f(1.0); // (;;")).toEqual(["float a = f(1.0);", "// (;"]);
    });

    it("never moves a semicolon to another line", () => {
        expect(cursorLines("for (\n// note\n;\n;\ni++) {")).toEqual(["for (", "// note", "i++) {"]);
        expect(cursorLines("#define OPEN (\\\n)\n;\nfloat b = 2.0;")).toEqual(["#define OPEN (\\", ")", "float b = 2.0;"]);
        expect(cursorLines("    #define OPEN (\n;\nfloat b = 2.0;")).toEqual(["#define OPEN (", "float b = 2.0;"]);
    });

    it("still drops empty statements outside parentheses", () => {
        expect(cursorLines("float a = 1.0;; float b = 2.0;")).toEqual(["float a = 1.0;", "float b = 2.0;"]);
    });
});
