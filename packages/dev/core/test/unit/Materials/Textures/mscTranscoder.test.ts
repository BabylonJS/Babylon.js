import { afterEach, describe, expect, it, vi } from "vitest";

import { MSCTranscoder } from "ktx2decoder/Transcoders/mscTranscoder";
import { Transcoder } from "ktx2decoder/transcoder";

const wasmBinary = new ArrayBuffer(8);
const transcoderScript = `
var MSC_TRANSCODER = async function (options) {
    return {
        initialized: false,
        wasmBinary: options.wasmBinary,
        initTranscoders: function () {
            this.initialized = true;
        }
    };
};`;

const originalWasmBinary = MSCTranscoder.WasmBinary;
const originalJSModule = MSCTranscoder.JSModule;
const originalJSModuleURL = MSCTranscoder.JSModuleURL;
const originalUseFromWorkerThread = MSCTranscoder.UseFromWorkerThread;

afterEach(() => {
    MSCTranscoder.WasmBinary = originalWasmBinary;
    MSCTranscoder.JSModule = originalJSModule;
    MSCTranscoder.JSModuleURL = originalJSModuleURL;
    MSCTranscoder.UseFromWorkerThread = originalUseFromWorkerThread;
    delete (globalThis as any).MSC_TRANSCODER;
    vi.unstubAllGlobals();
});

describe("MSCTranscoder", () => {
    it.each([
        ["an absent document", undefined],
        ["a Native-style document without element methods", {}],
    ])("loads and initializes the fetched factory with %s", async (_description, documentValue) => {
        const jsModuleUrl = "https://example.com/test-msc-transcoder.js";
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => transcoderScript,
        });
        vi.stubGlobal("document", documentValue);
        vi.stubGlobal("fetch", fetchMock);
        MSCTranscoder.WasmBinary = wasmBinary;
        MSCTranscoder.JSModule = null;
        MSCTranscoder.JSModuleURL = jsModuleUrl;
        MSCTranscoder.UseFromWorkerThread = false;

        const transcoder = new MSCTranscoder();
        await (transcoder as any)._getMSCBasisTranscoder();

        expect(fetchMock).toHaveBeenCalledExactlyOnceWith(Transcoder.GetWasmUrl(jsModuleUrl));
        expect((globalThis as any).MSC_TRANSCODER).toBeTypeOf("function");
        expect((transcoder as any)._mscBasisModule).toMatchObject({
            initialized: true,
            wasmBinary,
        });
    });

    it("rejects when fetching the factory script fails", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 503,
            statusText: "Service Unavailable",
        });
        vi.stubGlobal("document", undefined);
        vi.stubGlobal("fetch", fetchMock);
        MSCTranscoder.WasmBinary = wasmBinary;
        MSCTranscoder.JSModule = null;
        MSCTranscoder.UseFromWorkerThread = false;

        const transcoder = new MSCTranscoder();

        await expect((transcoder as any)._getMSCBasisTranscoder()).rejects.toThrow("Could not fetch the MSC transcoder script: 503 - Service Unavailable");
        expect(fetchMock).toHaveBeenCalledOnce();
    });
});
