import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type IMultiRenderTargetOptions } from "core/Materials/Textures/multiRenderTarget.pure";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import "core/Engines/WebGPU/Extensions/engine.multiRender";
import "core/Engines/WebGPU/Extensions/engine.renderTarget";

describe("WebGPU createMultipleRenderTarget", () => {
    let engine: WebGPUEngine;
    const releaseTexture = vi.fn();

    beforeEach(() => {
        // Bypass GPU initialization while exercising the real multi render target, depth texture and texture release paths.
        engine = Object.assign(Object.create(WebGPUEngine.prototype) as WebGPUEngine, {
            _caps: { supportSRGBBuffers: true },
            _timestampQuery: { enable: false },
            _internalTexturesCache: [],
            _renderTargetWrapperCache: [],
            _textureHelper: {
                createGPUTextureForInternalTexture: vi.fn(),
                releaseTexture,
            },
        });
        releaseTexture.mockClear();
    });

    afterEach(() => {
        for (const wrapper of engine._renderTargetWrapperCache.slice()) {
            wrapper.dispose();
        }
        vi.restoreAllMocks();
    });

    it.each<[string, IMultiRenderTargetOptions]>([
        ["a depth buffer", { textureCount: 2 }],
        ["a depth texture", { textureCount: 2, generateDepthTexture: true }],
    ])("registers %s once in the texture cache and removes it on dispose", (_, options) => {
        const initialCache = engine.getLoadedTexturesCache().slice();

        for (let cycle = 0; cycle < 2; cycle++) {
            const target = engine.createMultipleRenderTarget(16, options);
            const depthTexture = target._depthStencilTexture!;

            expect(depthTexture).toBeTruthy();
            expect(engine.getLoadedTexturesCache().filter((texture) => texture === depthTexture)).toHaveLength(1);

            target.dispose();

            expect(engine.getLoadedTexturesCache()).toEqual(initialCache);
            expect(releaseTexture.mock.calls.filter(([texture]) => texture === depthTexture)).toHaveLength(1);
        }
    });
});
