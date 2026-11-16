/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { EngineStore } from "core/Engines/engineStore";
import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUCacheBindGroups } from "core/Engines/WebGPU/webgpuCacheBindGroups";
import { WebGPUCacheRenderPipelineTree } from "core/Engines/WebGPU/webgpuCacheRenderPipelineTree";

// A NullEngine that reports isWebGPU and has the GPU members WebGPUEngine.dispose() touches, so the real
// WebGPUEngine.prototype.dispose() (and the real AbstractEngine.dispose() it calls) can run without a GPU.
function CreateWebGPULikeEngine(): NullEngine {
    return Object.assign(new NullEngine(), {
        _isWebGPU: true,
        _timestampQuery: { dispose: vi.fn() },
        _mainTexture: null,
        _depthTexture: null,
        _textureHelper: { destroyDeferredTextures: vi.fn() },
        _bufferManager: { destroyDeferredBuffers: vi.fn() },
        _device: { destroy: vi.fn() },
    });
}

// The members WebGPUEngine.dispose() releases are only assigned once initAsync() has acquired a device and created
// its managers, so an engine whose initialization was never run or did not complete has only some of them (or none).
function CreatePartiallyInitializedWebGPUEngine(members: object): NullEngine {
    return Object.assign(new NullEngine(), { _isWebGPU: true, _mainTexture: null, _depthTexture: null }, members);
}

function DisposeAsWebGPUEngine(engine: NullEngine): void {
    WebGPUEngine.prototype.dispose.call(engine as unknown as WebGPUEngine);
}

describe("WebGPUEngine.dispose", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        for (const engine of EngineStore.Instances.slice()) {
            engine.dispose();
        }
    });

    it("keeps the static caches while another WebGPU engine is alive and resets them when the last one is disposed", () => {
        const resetPipelines = vi.spyOn(WebGPUCacheRenderPipelineTree, "ResetCache");
        const resetBindGroups = vi.spyOn(WebGPUCacheBindGroups, "ResetCache");
        const first = CreateWebGPULikeEngine();
        const second = CreateWebGPULikeEngine();

        DisposeAsWebGPUEngine(first);

        expect(resetPipelines).not.toHaveBeenCalled();
        expect(resetBindGroups).not.toHaveBeenCalled();

        DisposeAsWebGPUEngine(second);

        expect(resetPipelines).toHaveBeenCalledOnce();
        expect(resetBindGroups).toHaveBeenCalledOnce();
    });

    it("resets the static caches when the last WebGPU engine is disposed while a non-WebGPU engine is still alive", () => {
        const resetPipelines = vi.spyOn(WebGPUCacheRenderPipelineTree, "ResetCache");
        const resetBindGroups = vi.spyOn(WebGPUCacheBindGroups, "ResetCache");
        const webgpuEngine = CreateWebGPULikeEngine();
        const otherEngine = new NullEngine();

        DisposeAsWebGPUEngine(webgpuEngine);

        expect(EngineStore.Instances).toHaveLength(1);
        expect(EngineStore.Instances[0]).toBe(otherEngine);
        expect(resetPipelines).toHaveBeenCalledOnce();
        expect(resetBindGroups).toHaveBeenCalledOnce();
    });

    it.each([
        ["initialization never ran", false, false],
        ["only the device was acquired", true, false],
        ["the device and buffer manager were created", true, true],
    ])("completes when %s", (_, hasDevice, hasBufferManager) => {
        const device = { destroy: vi.fn() };
        const bufferManager = { destroyDeferredBuffers: vi.fn() };
        const engine = CreatePartiallyInitializedWebGPUEngine({
            ...(hasDevice ? { _device: device } : {}),
            ...(hasBufferManager ? { _bufferManager: bufferManager } : {}),
        });

        expect(() => DisposeAsWebGPUEngine(engine)).not.toThrow();

        expect(EngineStore.Instances).not.toContain(engine);
        expect(device.destroy).toHaveBeenCalledTimes(hasDevice ? 1 : 0);
        expect(bufferManager.destroyDeferredBuffers).toHaveBeenCalledTimes(hasBufferManager ? 1 : 0);
    });

    it("removes the engine and its event listeners when initAsync() rejects because no device could be created", async () => {
        const adapter = { features: new Set(), limits: {}, info: {}, requestDevice: vi.fn().mockRejectedValue(new Error("requestDevice failed")) };
        Object.defineProperty(navigator, "gpu", {
            configurable: true,
            value: { getPreferredCanvasFormat: () => "bgra8unorm", requestAdapter: vi.fn().mockResolvedValue(adapter) },
        });
        const canvas = document.createElement("canvas");
        const targets = [canvas, window, document];
        const added = targets.map((target) => vi.spyOn(target, "addEventListener"));
        const removed = targets.map((target) => vi.spyOn(target, "removeEventListener"));

        try {
            const engine = new WebGPUEngine(canvas);
            await expect(engine.initAsync()).rejects.toThrow("requestDevice failed");

            expect(() => engine.dispose()).not.toThrow();

            expect(EngineStore.Instances).not.toContain(engine);
            for (let i = 0; i < targets.length; i++) {
                for (const [type, listener] of added[i].mock.calls) {
                    expect(removed[i]).toHaveBeenCalledWith(type, listener);
                }
            }
            expect(added.some((spy) => spy.mock.calls.length > 0)).toBe(true);
        } finally {
            delete (navigator as { gpu?: unknown }).gpu;
        }
    });
});
