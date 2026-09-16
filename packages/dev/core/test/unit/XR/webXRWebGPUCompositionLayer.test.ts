/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Viewport } from "core/Maths/math.viewport";
import { Scene } from "core/scene";
import { WebXRWebGPUCompositionLayerRenderTargetTextureProvider, WebXRWebGPUCompositionLayerWrapper } from "core/XR/features/Layers/WebXRWebGPUCompositionLayer";
import { type WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CompositionLayer = ConstructorParameters<typeof WebXRWebGPUCompositionLayerWrapper>[2];
type GPUBinding = ConstructorParameters<typeof WebXRWebGPUCompositionLayerRenderTargetTextureProvider>[1];
type GPUSubImage = ReturnType<GPUBinding["getSubImage"]>;
type Eye = NonNullable<Parameters<GPUBinding["getSubImage"]>[2]>;

function createTexture(name: string, width: number, height: number): GPUTexture {
    return { label: name, width, height } as GPUTexture;
}

function createSubImage(
    colorTexture: GPUTexture,
    depthStencilTexture: GPUTexture,
    viewport = { x: 0, y: 0, width: colorTexture.width, height: colorTexture.height },
    baseArrayLayer = 0
): GPUSubImage {
    return {
        colorTexture,
        depthStencilTexture,
        viewport,
        getViewDescriptor: () => ({ baseArrayLayer }),
    } as GPUSubImage;
}

describe("WebXRWebGPUCompositionLayerRenderTargetTextureProvider", () => {
    let engine: NullEngine;
    let scene: Scene;
    let currentFrame: XRFrame;
    let layer: CompositionLayer;
    let binding: { getSubImage: ReturnType<typeof vi.fn> };
    let wrapSpy: ReturnType<typeof vi.fn>;
    let updateSpy: ReturnType<typeof vi.fn>;

    function createRenderTargetProvider() {
        const wrapper = new WebXRWebGPUCompositionLayerWrapper(
            () => 2,
            () => 1,
            layer,
            "XRQuadLayer",
            false,
            (sessionManager) => new WebXRWebGPUCompositionLayerRenderTargetTextureProvider(sessionManager, binding as unknown as GPUBinding, wrapper)
        );
        return wrapper.createRenderTargetTextureProvider({ scene, currentFrame } as unknown as WebXRSessionManager);
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
        currentFrame = {} as XRFrame;
        layer = { width: 2, height: 1 } as unknown as CompositionLayer;
        binding = { getSubImage: vi.fn() };
        wrapSpy = vi.fn((texture: GPUTexture) => {
            const internalTexture = new InternalTexture(engine, InternalTextureSource.External, true);
            internalTexture.width = internalTexture.baseWidth = texture.width;
            internalTexture.height = internalTexture.baseHeight = texture.height;
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

    it("queries the current frame with the wrapped quad layer and requested eye", () => {
        const subImage = createSubImage(createTexture("color", 512, 256), createTexture("depth", 512, 256));
        binding.getSubImage.mockReturnValue(subImage);
        const provider = createRenderTargetProvider();
        const wrongLayer = {} as CompositionLayer;

        expect(provider.getRenderTargetTextureForView({ eye: "right" } as XRView)).not.toBeNull();

        expect(binding.getSubImage).toHaveBeenCalledExactlyOnceWith(layer, currentFrame, "right");
        expect(binding.getSubImage).not.toHaveBeenCalledWith(wrongLayer, currentFrame, "right");
    });

    it("repoints rotating compositor textures while preserving render target identity", () => {
        const firstColor = createTexture("color-1", 512, 256);
        const firstDepth = createTexture("depth-1", 512, 256);
        const secondColor = createTexture("color-2", 512, 256);
        const secondDepth = createTexture("depth-2", 512, 256);
        binding.getSubImage.mockReturnValueOnce(createSubImage(firstColor, firstDepth)).mockReturnValueOnce(createSubImage(secondColor, secondDepth));
        const provider = createRenderTargetProvider();

        const first = provider.getRenderTargetTextureForEye("left");
        const second = provider.getRenderTargetTextureForEye("left");

        expect(second).toBe(first);
        expect(wrapSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy.mock.calls[0][1]).toBe(secondColor);
        expect(updateSpy).not.toHaveBeenCalledWith(expect.anything(), firstColor);
        expect(updateSpy).not.toHaveBeenCalledWith(expect.anything(), firstDepth);
        expect(updateSpy).not.toHaveBeenCalledWith(expect.anything(), secondDepth);
    });

    it("disposes and rebuilds the render target when compositor texture size changes", () => {
        binding.getSubImage
            .mockReturnValueOnce(createSubImage(createTexture("color-1", 512, 256), createTexture("depth-1", 512, 256)))
            .mockReturnValueOnce(createSubImage(createTexture("color-2", 256, 128), createTexture("depth-2", 256, 128)));
        const provider = createRenderTargetProvider();

        const first = provider.getRenderTargetTextureForEye("left");
        const disposeSpy = vi.spyOn(first!, "dispose");
        const second = provider.getRenderTargetTextureForEye("left");

        expect(second).not.toBe(first);
        expect(second!.getRenderWidth()).toBe(256);
        expect(second!.getRenderHeight()).toBe(128);
        expect(disposeSpy).toHaveBeenCalledTimes(1);
        expect(wrapSpy).toHaveBeenCalledTimes(2);
        expect((provider as any)._renderTargetTextures).toEqual([second]);
    });

    it("normalizes the quad sub-image viewport by its color texture dimensions", () => {
        const color = createTexture("color", 800, 400);
        binding.getSubImage.mockReturnValue(createSubImage(color, createTexture("depth", 800, 400), { x: 200, y: 100, width: 400, height: 200 }));
        const provider = createRenderTargetProvider();
        const viewport = new Viewport(0, 0, 1, 1);

        expect(provider.trySetViewportForView(viewport, { eye: "left" } as XRView)).toBe(true);
        expect(viewport).toMatchObject({ x: 0.25, y: 0.25, width: 0.5, height: 0.5 });
    });

    it("routes each eye to the array layer from its sub-image descriptor", () => {
        binding.getSubImage.mockImplementation((_layer: CompositionLayer, _frame: XRFrame, eye: Eye) => {
            const arrayLayer = eye === "right" ? 1 : 0;
            return createSubImage(createTexture(`color-${eye}`, 512, 256), createTexture(`depth-${eye}`, 512, 256), undefined, arrayLayer);
        });
        const provider = createRenderTargetProvider();

        const left = provider.getRenderTargetTextureForEye("left");
        const right = provider.getRenderTargetTextureForEye("right");

        expect(left).not.toBe(right);
        expect((left as any).layerIndex).toBe(0);
        expect((right as any).layerIndex).toBe(1);
        expect(binding.getSubImage).toHaveBeenNthCalledWith(1, layer, currentFrame, "left");
        expect(binding.getSubImage).toHaveBeenNthCalledWith(2, layer, currentFrame, "right");
    });

    it("does not query the binding without a current XR frame", () => {
        const wrapper = new WebXRWebGPUCompositionLayerWrapper(
            () => 2,
            () => 1,
            layer,
            "XRQuadLayer",
            false,
            (sessionManager) => new WebXRWebGPUCompositionLayerRenderTargetTextureProvider(sessionManager, binding as unknown as GPUBinding, wrapper)
        );
        const provider = wrapper.createRenderTargetTextureProvider({ scene, currentFrame: null } as unknown as WebXRSessionManager);

        expect(provider.getRenderTargetTextureForEye("left")).toBeNull();
        expect(binding.getSubImage).not.toHaveBeenCalled();
    });
});
