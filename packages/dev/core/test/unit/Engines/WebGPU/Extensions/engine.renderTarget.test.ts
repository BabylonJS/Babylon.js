import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import "core/Engines/WebGPU/Extensions/engine.renderTarget";

describe("WebGPU createRenderTargetTexture", () => {
    let engine: WebGPUEngine;
    const createGPUTextureForInternalTexture = vi.fn();

    beforeEach(() => {
        // Bypass GPU initialization while exercising the real render target and internal texture allocation paths.
        engine = Object.assign(Object.create(WebGPUEngine.prototype) as WebGPUEngine, {
            _caps: { supportSRGBBuffers: true },
            _timestampQuery: { enable: false },
            _internalTexturesCache: [],
            _renderTargetWrapperCache: [],
            _textureHelper: {
                createGPUTextureForInternalTexture,
                releaseTexture: vi.fn(),
            },
        });
        createGPUTextureForInternalTexture.mockClear();
    });

    afterEach(() => {
        for (const wrapper of engine._renderTargetWrapperCache.slice()) {
            wrapper.dispose();
        }
        vi.restoreAllMocks();
    });

    it.each([true, false, undefined])("preserves useSRGBBuffer=%s through internal texture allocation", (useSRGBBuffer) => {
        const target = engine.createRenderTargetTexture(16, {
            generateDepthBuffer: false,
            useSRGBBuffer,
        });

        expect(target.texture?._useSRGBBuffer).toBe(useSRGBBuffer ?? false);
        expect(createGPUTextureForInternalTexture).toHaveBeenCalledExactlyOnceWith(target.texture, undefined, undefined, undefined, 0);
    });

    it("does not change or reallocate an existing color attachment", () => {
        const attachment = new InternalTexture(engine, InternalTextureSource.RenderTarget);
        attachment._useSRGBBuffer = false;

        const target = engine.createRenderTargetTexture(16, {
            generateDepthBuffer: false,
            colorAttachment: attachment,
            useSRGBBuffer: true,
        });

        expect(target.texture).toBe(attachment);
        expect(attachment._useSRGBBuffer).toBe(false);
        expect(createGPUTextureForInternalTexture).not.toHaveBeenCalled();
    });

    it("does not allocate a color texture when noColorAttachment is set", () => {
        const createInternalTexture = vi.spyOn(engine, "_createInternalTexture");
        const target = engine.createRenderTargetTexture(16, {
            generateDepthBuffer: false,
            noColorAttachment: true,
            useSRGBBuffer: true,
        });

        expect(target.texture).toBeNull();
        expect(createInternalTexture).not.toHaveBeenCalled();
        expect(createGPUTextureForInternalTexture).not.toHaveBeenCalled();
    });
});
