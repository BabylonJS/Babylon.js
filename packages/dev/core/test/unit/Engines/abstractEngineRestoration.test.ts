import { NullEngine } from "core/Engines/nullEngine";
import { Logger } from "core/Misc/logger";
import { describe, expect, it, onTestFinished, vi } from "vitest";

describe("Engine context restoration", () => {
    it("waits for asynchronous device initialization before rebuilding resources", async () => {
        const engine = new NullEngine();
        onTestFinished(() => engine.dispose());
        let finish!: () => void;
        const initialized = new Promise<void>((resolve) => {
            finish = resolve;
        });
        const init = vi.fn(async () => await initialized);
        const rebuild = vi.fn();
        engine["_rebuildGraphicsResources"] = rebuild;
        const restored = vi.fn();
        engine.onContextRestoredObservable.add(restored);
        engine["_restoreEngineAfterContextLost"](init);
        await vi.waitFor(() => expect(init).toHaveBeenCalledOnce());
        expect(rebuild).not.toHaveBeenCalled();
        expect(restored).not.toHaveBeenCalled();
        finish();
        await vi.waitFor(() => expect(restored).toHaveBeenCalledOnce());
        expect(rebuild).toHaveBeenCalledOnce();
    });

    it("reports initialization failures without rebuilding or declaring restoration", async () => {
        const engine = new NullEngine();
        const error = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        onTestFinished(() => {
            error.mockRestore();
            engine.dispose();
        });
        const rebuild = vi.fn();
        engine["_rebuildGraphicsResources"] = rebuild;
        const restored = vi.fn();
        engine.onContextRestoredObservable.add(restored);
        engine["_restoreEngineAfterContextLost"](async () => {
            throw new Error("device unavailable");
        });
        await vi.waitFor(() => expect(error).toHaveBeenCalledWith(expect.stringContaining("device unavailable")));
        expect(rebuild).not.toHaveBeenCalled();
        expect(restored).not.toHaveBeenCalled();
    });
});
