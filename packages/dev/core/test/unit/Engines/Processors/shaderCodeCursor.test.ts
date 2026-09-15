import { describe, expect, it } from "vitest";

import { ShaderCodeCursor } from "core/Engines/Processors/shaderCodeCursor";

function getCursorLines(sourceLine: string | string[]): string[] {
    const cursor = new ShaderCodeCursor();
    const lines: string[] = [];

    cursor.lineIndex = -1;
    cursor.lines = typeof sourceLine === "string" ? [sourceLine] : sourceLine;

    while (cursor.canRead) {
        cursor.lineIndex++;
        lines.push(cursor.currentLine);
    }

    return lines;
}

describe("ShaderCodeCursor", () => {
    it.each([
        ["for (;;)", ["for (;", ";", ")"]],
        ["for (var i = 0;;)", ["for (var i = 0;", ";", ")"]],
        ["for (;;i++)", ["for (;", ";", "i++)"]],
    ])("preserves empty clauses in %s", (sourceLine, expected) => {
        expect(getCursorLines(sourceLine)).toEqual(expected);
    });

    it("keeps splitting a normal sequence of statements", () => {
        expect(getCursorLines("foo(); bar();")).toEqual(["foo();", "bar();"]);
    });

    it("keeps ignoring a standalone semicolon", () => {
        expect(getCursorLines(";")).toEqual([]);
    });

    it("keeps an inline comment attached before else without extracting its semicolons", () => {
        expect(getCursorLines(["if (true) { fragColor = vec4(1.0); } // no-op: ;;", "else { fragColor = vec4(0.0); }"])).toEqual([
            "if (true) { fragColor = vec4(1.0);",
            "} // no-op: ;;",
            "else { fragColor = vec4(0.0);",
            "}",
        ]);
    });

    it("attaches an inline comment to the last code statement", () => {
        expect(getCursorLines("foo(); bar(); // ;;")).toEqual(["foo();", "bar(); // ;;"]);
    });

    it.each(["// ;;", "   // ;;"])("preserves a standalone comment: %s", (sourceLine) => {
        expect(getCursorLines(sourceLine)).toEqual([sourceLine]);
    });

    it("preserves an empty statement between other statements", () => {
        expect(getCursorLines("foo();; bar();")).toEqual(["foo();", ";", "bar();"]);
    });
});
