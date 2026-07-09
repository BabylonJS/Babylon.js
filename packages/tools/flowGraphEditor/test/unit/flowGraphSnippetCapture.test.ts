import { describe, it, expect, vi } from "vitest";

import { CaptureFlowGraphSnippetId } from "../../src/components/preview/flowGraphSnippetCapture";

/**
 * Build a fake BABYLON-like namespace whose `...FromSnippetAsync` loaders are
 * spies, so tests can assert both the captured id and that the original is still
 * invoked (delegation) / restored.
 */
function createNamespace() {
    return {
        ParseFlowGraphCoordinatorFromSnippetAsync: vi.fn(async (_id: string) => "coordinator"),
        ParseFlowGraphFromSnippetAsync: vi.fn(async (_id: string) => "graph"),
        SomeOtherFunction: vi.fn(() => "noop"),
        NotAFunction: 42,
    };
}

describe("CaptureFlowGraphSnippetId", () => {
    it("captures the id from a live loader call and delegates to the original", async () => {
        const ns = createNamespace();
        const original = ns.ParseFlowGraphCoordinatorFromSnippetAsync;

        const capture = CaptureFlowGraphSnippetId(ns);
        const result = await ns.ParseFlowGraphCoordinatorFromSnippetAsync("#ABC123#0", { scene: {} } as any);

        expect(capture.snippetId).toBe("#ABC123#0");
        expect(original).toHaveBeenCalledTimes(1);
        expect(result).toBe("coordinator");
        capture.restore();
    });

    it("returns null when no loader is ever called (commented-out / inert scene)", () => {
        const ns = createNamespace();
        const capture = CaptureFlowGraphSnippetId(ns);
        // Nothing runs — mirrors a preview scene whose loader is commented out.
        expect(capture.snippetId).toBeNull();
        capture.restore();
    });

    it("keeps the first live call when several loaders run", async () => {
        const ns = createNamespace();
        const capture = CaptureFlowGraphSnippetId(ns);

        await ns.ParseFlowGraphCoordinatorFromSnippetAsync("#FIRST#0", {} as any);
        await ns.ParseFlowGraphFromSnippetAsync("#SECOND#1", {} as any);

        expect(capture.snippetId).toBe("#FIRST#0");
        capture.restore();
    });

    it("wraps every matching loader, not just the coordinator one", async () => {
        const ns = createNamespace();
        const capture = CaptureFlowGraphSnippetId(ns);

        await ns.ParseFlowGraphFromSnippetAsync("#GRAPHONLY#2", {} as any);

        expect(capture.snippetId).toBe("#GRAPHONLY#2");
        capture.restore();
    });

    it("ignores non-loader functions and non-function properties", () => {
        const ns = createNamespace();
        const otherOriginal = ns.SomeOtherFunction;
        const capture = CaptureFlowGraphSnippetId(ns);

        // A non-loader function is left untouched (not wrapped).
        expect(ns.SomeOtherFunction).toBe(otherOriginal);
        ns.SomeOtherFunction();
        expect(capture.snippetId).toBeNull();
        expect(ns.NotAFunction).toBe(42);
        capture.restore();
    });

    it("ignores empty / non-string ids", async () => {
        const ns = createNamespace();
        const capture = CaptureFlowGraphSnippetId(ns);

        await ns.ParseFlowGraphCoordinatorFromSnippetAsync("   ", {} as any);
        await ns.ParseFlowGraphCoordinatorFromSnippetAsync(undefined as any, {} as any);

        expect(capture.snippetId).toBeNull();
        capture.restore();
    });

    it("restores the original loaders", () => {
        const ns = createNamespace();
        const original = ns.ParseFlowGraphCoordinatorFromSnippetAsync;

        const capture = CaptureFlowGraphSnippetId(ns);
        expect(ns.ParseFlowGraphCoordinatorFromSnippetAsync).not.toBe(original);

        capture.restore();
        expect(ns.ParseFlowGraphCoordinatorFromSnippetAsync).toBe(original);
    });

    it("is a safe no-op when the namespace is missing", () => {
        const capture = CaptureFlowGraphSnippetId(null);
        expect(capture.snippetId).toBeNull();
        expect(() => capture.restore()).not.toThrow();
    });
});
