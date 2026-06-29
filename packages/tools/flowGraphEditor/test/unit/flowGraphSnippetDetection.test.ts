import { describe, it, expect } from "vitest";

import { DetectFlowGraphSnippetId } from "../../src/components/preview/flowGraphSnippetDetection";

describe("DetectFlowGraphSnippetId", () => {
    it("returns the id for a live single-line call", () => {
        const source = `await ParseFlowGraphCoordinatorFromSnippetAsync("#ABC123#0", { scene });`;
        expect(DetectFlowGraphSnippetId([source])).toBe("#ABC123#0");
    });

    it("returns null when the call is fully line-commented", () => {
        const source = `// await ParseFlowGraphCoordinatorFromSnippetAsync("#ABC123#0", { scene });`;
        expect(DetectFlowGraphSnippetId([source])).toBeNull();
    });

    it("returns null when the call is inside a block comment", () => {
        const source = [
            "/*",
            "  Inert preview scene — the flow graph loader is intentionally disabled:",
            `  await ParseFlowGraphCoordinatorFromSnippetAsync("#ABC123#0", { scene });`,
            "*/",
        ].join("\n");
        expect(DetectFlowGraphSnippetId([source])).toBeNull();
    });

    it("returns the live id when a live call is accompanied by a commented one", () => {
        const source = [
            `// await ParseFlowGraphCoordinatorFromSnippetAsync("#OLD123#0", { scene });`,
            `await ParseFlowGraphCoordinatorFromSnippetAsync("#NEW456#1", { scene });`,
        ].join("\n");
        expect(DetectFlowGraphSnippetId([source])).toBe("#NEW456#1");
    });

    it("does not falsely detect a FromSnippetAsync occurrence inside a string/URL literal", () => {
        const source = `const docs = "https://example.com/FlowGraphParseFromSnippetAsync('#NOPE#0')";`;
        expect(DetectFlowGraphSnippetId([source])).toBeNull();
    });

    it("ignores a // sequence that is part of a URL string and still finds the live call", () => {
        const source = [`const docs = "https://playground.babylonjs.com/#ABC";`, `await GetFlowGraphFromSnippetAsync('#LIVE99#2', { scene });`].join("\n");
        expect(DetectFlowGraphSnippetId([source])).toBe("#LIVE99#2");
    });

    it("scans additional files and honors first-match ordering", () => {
        const code = `// const a = 1;`;
        const extraFile = `await ParseFlowGraphCoordinatorFromSnippetAsync("#FROMFILE#3", { scene });`;
        expect(DetectFlowGraphSnippetId([code, extraFile])).toBe("#FROMFILE#3");
    });

    it("returns null when there is no snippet reference at all", () => {
        const source = `const scene = new Scene(engine);`;
        expect(DetectFlowGraphSnippetId([source])).toBeNull();
    });

    it("ignores null and undefined sources", () => {
        expect(DetectFlowGraphSnippetId([null, undefined])).toBeNull();
    });
});
