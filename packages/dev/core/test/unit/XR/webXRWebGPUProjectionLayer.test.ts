/**
 * @vitest-environment jsdom
 */

import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Viewport } from "core/Maths/math.viewport";
import { Scene } from "core/scene";
import { CreateDefaultXRGPUProjectionLayerInit, WebXRWebGPUProjectionLayerWrapper } from "core/XR/features/Layers/WebXRWebGPUProjectionLayer";
import { WebXRLayerRenderTargetTexture } from "core/XR/webXRLayerRenderTargetTexture";
import { type WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Build a minimal XRGPUSubImage-shaped object. Typed loosely because the WebGPU-XR ambient types are not
// registered as eslint globals in the test environment.
function createSubImage(width: number, height: number, viewport = { x: 0, y: 0, width, height }, baseArrayLayer = 0): any {
    return {
        colorTexture: { width, height },
        depthStencilTexture: { width, height },
        viewport,
        getViewDescriptor: () => ({ baseArrayLayer }),
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

        it("marks the per-eye render target to skip the engine's render-target Y-flip", () => {
            // XR projection-layer textures are presented directly by the XR compositor (top-left origin, never
            // re-sampled), so the provider opts them out of the WebGPU engine's render-target Y-flip / winding
            // compensation via the _disableEngineYFlip wrapper flag. Non-XR render targets must leave it false.
            const provider = createProvider(createSubImage(512, 512));
            const rtt = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);

            expect(rtt).not.toBeNull();
            expect((rtt!.renderTarget as any)._disableEngineYFlip).toBe(true);

            // A plain render target created directly by the engine must not carry the flag.
            const plainRtt = scene.getEngine().createRenderTargetTexture(256, { generateDepthBuffer: true, generateStencilBuffer: false });
            expect((plainRtt as any)._disableEngineYFlip).toBeFalsy();
            plainRtt.dispose();
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

        it("routes the per-eye array layer from the sub-image view descriptor into the render target", () => {
            // Projection-layer textures may be a texture array with one layer per eye (left=0, right=1);
            // the provider must read baseArrayLayer from getViewDescriptor() and set it on the RTT so each
            // eye binds its own layer.
            const binding: any = {
                getViewSubImage: vi.fn((_layer: unknown, view: XRView) => createSubImage(512, 512, undefined, view.eye === "right" ? 1 : 0)),
            };
            const layer: any = { textureWidth: 512, textureHeight: 512 };
            const wrapper = new WebXRWebGPUProjectionLayerWrapper(layer, false, binding, "depth24plus-stencil8");
            const provider = wrapper.createRenderTargetTextureProvider({ scene } as unknown as WebXRSessionManager);

            const leftRtt = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);
            const rightRtt = provider.getRenderTargetTextureForView({ eye: "right" } as XRView);

            expect(leftRtt).not.toBeNull();
            expect(rightRtt).not.toBeNull();
            expect(leftRtt).not.toBe(rightRtt);
            expect((leftRtt as any).layerIndex).toBe(0);
            expect((rightRtt as any).layerIndex).toBe(1);
        });

        it("creates WebXRLayerRenderTargetTexture instances that bind their own array layer", () => {
            // The per-eye array-layer index lives on the XR-area WebXRLayerRenderTargetTexture subclass (not on
            // the general-purpose RenderTargetTexture); its _bindFrameBuffer override binds that layer when the
            // scene binds the target with no explicit layer.
            const provider = createProvider(createSubImage(512, 512, undefined, 1));
            const rtt = provider.getRenderTargetTextureForView({ eye: "right" } as XRView);

            expect(rtt).toBeInstanceOf(WebXRLayerRenderTargetTexture);
            expect((rtt as any).layerIndex).toBe(1);

            const bindSpy = vi.spyOn(engine, "bindFramebuffer");
            rtt!._bindFrameBuffer();
            // engine.bindFramebuffer(renderTarget, faceIndex, requiredWidth, requiredHeight, forceFullscreen, lodLevel, layer)
            expect(bindSpy).toHaveBeenCalledTimes(1);
            expect(bindSpy.mock.calls[0][6]).toBe(1);
        });

        it("attaches a clear observer to each created per-eye render target", () => {
            // The scene skips clearing the right eye's framebuffer (Scene._clearFrameBuffer -> !isRightCamera),
            // so each per-eye WebGPU render target carries an onClearObservable observer to clear itself. The
            // scene notifies onClearObservable regardless of isRightCamera, so both eyes are cleared.
            const provider = createProvider(createSubImage(512, 512));
            const rtt = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);

            expect(rtt).not.toBeNull();
            expect(rtt!.onClearObservable.hasObservers()).toBe(true);
        });

        it("the per-eye clear observer clears color, depth and stencil with the scene clear color", () => {
            const provider = createProvider(createSubImage(512, 512));
            const rtt = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);

            const clearSpy = vi.spyOn(engine, "clear");
            rtt!.onClearObservable.notifyObservers(engine);

            // color = scene.clearColor (the RTT has no per-target clearColor), plus depth and stencil.
            expect(clearSpy).toHaveBeenCalledWith(scene.clearColor, true, true, true);
        });

        it("the per-eye clear observer honors skipInitialClear", () => {
            const provider = createProvider(createSubImage(512, 512));
            const rtt = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);
            rtt!.skipInitialClear = true;

            const clearSpy = vi.spyOn(engine, "clear");
            rtt!.onClearObservable.notifyObservers(engine);

            expect(clearSpy).not.toHaveBeenCalled();
        });

        it("the per-eye clear observer does not clear when scene.autoClear is disabled", () => {
            const provider = createProvider(createSubImage(512, 512));
            const rtt = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);
            scene.autoClear = false;

            const clearSpy = vi.spyOn(engine, "clear");
            rtt!.onClearObservable.notifyObservers(engine);

            expect(clearSpy).not.toHaveBeenCalled();
        });

        it("the per-eye clear observer clears color only once per frame (guarded by _cleared)", () => {
            const provider = createProvider(createSubImage(512, 512));
            const rtt = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);

            const clearSpy = vi.spyOn(engine, "clear");
            // First notification in the frame: color is cleared (RTT starts uncleared).
            rtt!.onClearObservable.notifyObservers(engine);
            expect(clearSpy).toHaveBeenLastCalledWith(scene.clearColor, true, true, true);
            // Second notification in the same frame (no per-frame reset): color clear is skipped, depth+stencil still cleared.
            rtt!.onClearObservable.notifyObservers(engine);
            expect(clearSpy).toHaveBeenLastCalledWith(scene.clearColor, false, true, true);
        });

        it("disposes the previous per-eye render target on a size change without leaking registry entries", () => {
            const binding: any = { getViewSubImage: vi.fn() };
            binding.getViewSubImage.mockReturnValueOnce(createSubImage(512, 512)).mockReturnValueOnce(createSubImage(256, 256));
            const layer: any = { textureWidth: 512, textureHeight: 512 };
            const wrapper = new WebXRWebGPUProjectionLayerWrapper(layer, false, binding, "depth24plus-stencil8");
            const provider = wrapper.createRenderTargetTextureProvider({ scene } as unknown as WebXRSessionManager);

            const first = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);
            const disposeSpy = vi.spyOn(first!, "dispose");
            const second = provider.getRenderTargetTextureForView({ eye: "left" } as XRView);

            // The stale target is disposed on rebuild...
            expect(disposeSpy).toHaveBeenCalledTimes(1);
            expect(second).not.toBe(first);
            // ...and the owned registry holds exactly the current target (no duplicate / leaked entries).
            const registry = (provider as any)._renderTargetTextures as unknown[];
            expect(registry.length).toBe(1);
            expect(registry[0]).toBe(second);
        });
    });
});
