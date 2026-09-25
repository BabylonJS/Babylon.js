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

    it("keeps empty clauses of a for loop header split over several lines", () => {
        expect(cursorLines("for (\n;\n;\ni++) {")).toEqual(["for (;;", "i++) {"]);
        expect(cursorLines("for (int i = 0;\n;\ni++) {")).toEqual(["for (int i = 0;;", "i++) {"]);
    });

    it("ignores parentheses in a trailing comment and after a closing brace", () => {
        expect(cursorLines("float a = 1.0; // (see note\n;\nfloat b = 2.0;")).toEqual(["float a = 1.0;", "// (see note", "float b = 2.0;"]);
        expect(cursorLines("/* ( */ }\n;\nfloat b = 2.0;")).toEqual(["/* ( */ }", "float b = 2.0;"]);
    });

    it("ignores braces and parentheses in block comments", () => {
        expect(cursorLines("for (/* } */; ; ) { break; }")).toEqual(["for (/* } */;;", ") { break;", "}"]);
        expect(cursorLines("for (/* x\n} */\n;\n;\ni++) {")).toEqual(["for (/* x", "} */;;", "i++) {"]);
        expect(cursorLines("/* ( */\n;\nfloat b = 2.0;")).toEqual(["/* ( */", "float b = 2.0;"]);
    });

    it("tracks block comments through lines starting with #", () => {
        expect(cursorLines("void main() {\n/*\n# note */\nfor (;;) { break; }\n}")).toEqual(["void main() {", "/*", "# note */", "for (;;", ") { break;", "}", "}"]);
        expect(cursorLines("#define A 1 /* (\n( */\n;\nfloat b = 2.0;")).toEqual(["#define A 1 /* (", "( */", "float b = 2.0;"]);
    });

    it("counts code after a block comment closes on a line starting with #", () => {
        expect(cursorLines("/*\n# note */ for (\n;\n;\ni++) {")).toEqual(["/*", "# note */ for (;;", "i++) {"]);
    });

    it("does not count parentheses of a directive that follows a block comment close", () => {
        expect(cursorLines("/*\n# note */ #define F(a) (a\n;\nfloat b = 2.0;")).toEqual(["/*", "# note */ #define F(a) (a", "float b = 2.0;"]);
        expect(cursorLines("/*\n# note */ /* x */ #define F(a) (a\n;\nfloat b = 2.0;")).toEqual(["/*", "# note */ /* x */ #define F(a) (a", "float b = 2.0;"]);
    });

    it("does not count parentheses of preprocessor lines", () => {
        expect(cursorLines("#define F(a) (a\n;\nfloat b = 2.0;")).toEqual(["#define F(a) (a", "float b = 2.0;"]);
    });

    it("still drops empty statements outside parentheses", () => {
        expect(cursorLines("float a = 1.0;; float b = 2.0;")).toEqual(["float a = 1.0;", "float b = 2.0;"]);
    });
});
