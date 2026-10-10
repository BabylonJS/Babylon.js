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
});
