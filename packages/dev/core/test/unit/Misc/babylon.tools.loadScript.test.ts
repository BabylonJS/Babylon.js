import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Tools } from "core/Misc/tools";

/**
 * Tests for Tools.LoadScript / _LoadScriptWeb, specifically the module-worker
 * fallback introduced in PR #18144.
 *
 * `importScripts` does not exist in Node, so we stub it globally to simulate
 * classic and module-type worker environments.
 */
describe("Tools.LoadScript — worker paths", () => {
    const dataUri = "data:text/javascript,export default {}";

    beforeEach(() => {
        // Ensure we start each test without a global importScripts
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("calls onSuccess when importScripts succeeds (classic worker)", () => {
        const mockImportScripts = vi.fn();
        vi.stubGlobal("importScripts", mockImportScripts);

        const onSuccess = vi.fn();
        const onError = vi.fn();

        Tools.LoadScript("http://example.com/script.js", onSuccess, onError);

        expect(mockImportScripts).toHaveBeenCalledWith("http://example.com/script.js");
        expect(onSuccess).toHaveBeenCalledOnce();
        expect(onError).not.toHaveBeenCalled();
    });

    it("falls back to import() on TypeError and calls onSuccess when import resolves (module worker)", async () => {
        vi.stubGlobal(
            "importScripts",
            vi.fn(() => {
                throw new TypeError("Failed to execute 'importScripts'");
            })
        );

        await expect(Tools.LoadScriptAsync(dataUri)).resolves.toBeUndefined();
    });

    it("falls back to import() on TypeError and calls onError when import rejects (module worker, bad URL)", async () => {
        vi.stubGlobal(
            "importScripts",
            vi.fn(() => {
                throw new TypeError("Failed to execute 'importScripts'");
            })
        );

        await expect(Tools.LoadScriptAsync("data:text/javascript,throw new Error('fail')")).rejects.toThrow();
    });

    it("calls onError immediately for non-TypeError exceptions", () => {
        const networkError = new Error("network error");
        vi.stubGlobal(
            "importScripts",
            vi.fn(() => {
                throw networkError;
            })
        );

        const onSuccess = vi.fn();
        const onError = vi.fn();

        Tools.LoadScript("http://example.com/script.js", onSuccess, onError);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("Unable to load script"), networkError);
    });
});
