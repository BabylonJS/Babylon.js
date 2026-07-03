/**
 * @vitest-environment jsdom
 */

import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Viewport } from "core/Maths/math.viewport";
import { Scene } from "core/scene";
import { CreateDefaultXRGPUProjectionLayerInit, WebXRWebGPUProjectionLayerWrapper } from "core/XR/features/Layers/WebXRWebGPUProjectionLayer";
import { type WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Build a minimal XRGPUSubImage-shaped object. Typed loosely because the WebGPU-XR ambient types are not
// registered as eslint globals in the test environment.
function createSubImage(width: number, height: number, viewport = { x: 0, y: 0, width, height }): any {
    return {
        colorTexture: { width, height },
        depthStencilTexture: { width, height },
        viewport,
        getViewDescriptor: () => ({}),
    };
}

describe("WebXRWebGPUProjectionLayer", () => {
    describe("CreateDefaultXRGPUProjectionLayerInit", () => {
        it("uses the provided color format and sensible defaults", () => {
            const init = CreateDefaultXRGPUProjectionLayerInit("rgba8unorm");
            expect(init.colorFormat).toBe("rgba8unorm");
            expect(init.depthStencilFormat).toBe("depth24plus-stencil8");
            // GPUTextureUsage.RENDER_ATTACHMENT
            expect(init.textureUsage).toBe(0x10);
            expect(init.scaleFactor).toBe(1.0);
        });

        it("allows overriding the depth/stencil format", () => {
            const init = CreateDefaultXRGPUProjectionLayerInit("rgba8unorm", "depth24plus");
            expect(init.depthStencilFormat).toBe("depth24plus");
        });
    });

    describe("WebXRWebGPUProjectionLayerRenderTargetTextureProvider", () => {
        let engine: NullEngine;
        let scene: Scene;
        let wrappedTextures: InternalTexture[];
        let wrapSpy: ReturnType<typeof vi.fn>;
        let updateSpy: ReturnType<typeof vi.fn>;

        function createProvider(subImage: any) {
            const binding: any = {
                getViewSubImage: vi.fn(() => subImage),
                getSubImage: vi.fn(() => subImage),
            };
            const layer: any = { textureWidth: 512, textureHeight: 512 };
            const wrapper = new WebXRWebGPUProjectionLayerWrapper(layer, false, binding, "depth24plus-stencil8");
            const sessionManager = { scene } as unknown as WebXRSessionManager;
            return wrapper.createRenderTargetTextureProvider(sessionManager);
        }

        beforeEach(() => {
            engine = new NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });
            scene = new Scene(engine);
            wrappedTextures = [];
            wrapSpy = vi.fn((texture: { width: number; height: number }) => {
                const internalTexture = new InternalTexture(engine, InternalTextureSource.External, true);
                internalTexture.width = internalTexture.baseWidth = texture.width;
                internalTexture.height = internalTexture.baseHeight = texture.height;
                wrappedTextures.push(internalTexture);
                return internalTexture;
            });
            updateSpy = vi.fn();
            (engine as any).wrapWebGPUTexture = wrapSpy;
            (engine as any).updateWrappedWebGPUTexture = updateSpy;
        });

        afterEach(() => {
            scene.dispose();
            engine.dispose();
        });

        it("builds a render target sized from the sub-image color texture and wraps color + depth", () => {
            const provider = createProvider(createSubImage(512, 512));
            const rtt = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);

            expect(rtt).not.toBeNull();
            expect(rtt!.getRenderWidth()).toBe(512);
            expect(rtt!.getRenderHeight()).toBe(512);
            // One wrap for color, one for depth.
            expect(wrapSpy).toHaveBeenCalledTimes(2);
            expect(updateSpy).not.toHaveBeenCalled();
        });

        it("sets the correct Babylon depth format on the wrapped depth texture", () => {
            const provider = createProvider(createSubImage(512, 512));
            provider.getRenderTargetTextureForView({ eye: "left" } as XRView);

            const depthTexture = wrappedTextures.find((texture) => texture.format === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8);
            expect(depthTexture).toBeDefined();
        });

        it("repoints the wrapped textures instead of rebuilding when the size is unchanged", () => {
            const provider = createProvider(createSubImage(512, 512));
            const first = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);
            const second = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);

            // Same RenderTargetTexture identity is preserved across frames.
            expect(second).toBe(first);
            // No additional wrapping happened (still just the initial color + depth).
            expect(wrapSpy).toHaveBeenCalledTimes(2);
            // Color + depth were repointed on the second frame.
            expect(updateSpy).toHaveBeenCalledTimes(2);
        });

        it("rebuilds the render target when the sub-image size changes", () => {
            const binding: any = { getViewSubImage: vi.fn() };
            binding.getViewSubImage.mockReturnValueOnce(createSubImage(512, 512)).mockReturnValueOnce(createSubImage(256, 256));
            const layer: any = { textureWidth: 512, textureHeight: 512 };
            const wrapper = new WebXRWebGPUProjectionLayerWrapper(layer, false, binding, "depth24plus-stencil8");
            const provider = wrapper.createRenderTargetTextureProvider({ scene } as unknown as WebXRSessionManager);

            const first = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);
            const second = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);

            expect(second).not.toBe(first);
            expect(second!.getRenderWidth()).toBe(256);
            // Two wraps for the first RTT, two more for the rebuilt RTT.
            expect(wrapSpy).toHaveBeenCalledTimes(4);
        });

        it("normalizes the viewport by the sub-image color texture dimensions", () => {
            const provider = createProvider(createSubImage(512, 512, { x: 128, y: 64, width: 256, height: 128 }));
            const viewport = new Viewport(0, 0, 1, 1);
            const result = provider.trySetViewportForView(viewport, { eye: "left" } as XRView);

            expect(result).toBe(true);
            expect(viewport.x).toBeCloseTo(0.25);
            expect(viewport.y).toBeCloseTo(0.125);
            expect(viewport.width).toBeCloseTo(0.5);
            expect(viewport.height).toBeCloseTo(0.25);
        });
    });
});
