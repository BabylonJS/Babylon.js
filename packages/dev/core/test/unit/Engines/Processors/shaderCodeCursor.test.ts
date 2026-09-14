import { describe, expect, it } from "vitest";

import { ShaderCodeCursor } from "core/Engines/Processors/shaderCodeCursor";

function getCursorLines(sourceLine: string): string[] {
    const cursor = new ShaderCodeCursor();
    const lines: string[] = [];

    cursor.lineIndex = -1;
    cursor.lines = [sourceLine];

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

    it("preserves an empty statement between other statements", () => {
        expect(getCursorLines("foo();; bar();")).toEqual(["foo();", ";", "bar();"]);
    });
});
