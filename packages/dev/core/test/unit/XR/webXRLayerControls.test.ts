/**
 * @vitest-environment jsdom
 */

import { WebXRCompositionLayerWrapper } from "core/XR/features/Layers/WebXRCompositionLayer";
import { WebXRProjectionLayerWrapper } from "core/XR/features/Layers/WebXRProjectionLayer";
import { WebXRWebGPUCompositionLayerWrapper } from "core/XR/features/Layers/WebXRWebGPUCompositionLayer";
import { WebXRWebGPUProjectionLayerWrapper } from "core/XR/features/Layers/WebXRWebGPUProjectionLayer";
import { WebXRWebGLLayerWrapper } from "core/XR/webXRWebGLLayer";
import { describe, expect, it, vi } from "vitest";

type CompositionLayer = ConstructorParameters<typeof WebXRCompositionLayerWrapper>[2];
type ProjectionLayer = ConstructorParameters<typeof WebXRProjectionLayerWrapper>[0];
type GPUBinding = ConstructorParameters<typeof WebXRWebGPUProjectionLayerWrapper>[2];
type LayerQuality = NonNullable<CompositionLayer["quality"]>;

const unusedProvider = () => {
    throw new Error("The render target provider is not used by these tests.");
};

function createCompositionWrapper(layer: CompositionLayer): WebXRCompositionLayerWrapper {
    return new WebXRCompositionLayerWrapper(
        () => 1,
        () => 1,
        layer,
        "XRQuadLayer",
        false,
        unusedProvider
    );
}

function createWebGPUCompositionWrapper(layer: CompositionLayer): WebXRWebGPUCompositionLayerWrapper {
    return new WebXRWebGPUCompositionLayerWrapper(
        () => 1,
        () => 1,
        layer,
        "XRQuadLayer",
        false,
        unusedProvider
    );
}

function createProjectionLayer(fixedFoveation: number | null): ProjectionLayer {
    return {
        fixedFoveation,
        textureHeight: 512,
        textureWidth: 1024,
    } as ProjectionLayer;
}

describe("WebXR composition layer controls", () => {
    it.each([
        ["WebGL", createCompositionWrapper],
        ["WebGPU", createWebGPUCompositionWrapper],
    ])("exposes supported controls through the %s wrapper", (_backend, createWrapper) => {
        const layer = {
            forceMonoPresentation: false,
            opacity: 0.75,
            quality: "default",
        } as CompositionLayer;
        const wrapper = createWrapper(layer);

        expect(wrapper.isOpacitySupported).toBe(true);
        expect(wrapper.opacity).toBe(0.75);
        wrapper.opacity = 0.5;
        expect(layer.opacity).toBe(0.5);

        expect(wrapper.isQualitySupported).toBe(true);
        expect(wrapper.quality).toBe("default");
        wrapper.quality = "text-optimized";
        expect(layer.quality).toBe("text-optimized");

        expect(wrapper.isForceMonoPresentationSupported).toBe(true);
        expect(wrapper.forceMonoPresentation).toBe(false);
        wrapper.forceMonoPresentation = true;
        expect(layer.forceMonoPresentation).toBe(true);
    });

    it("detects every unsupported control independently and rejects unsupported access", () => {
        const unsupportedWrapper = createCompositionWrapper({} as CompositionLayer);
        const opacityOnlyLayer = { opacity: 1 } as CompositionLayer;
        const wrapper = createCompositionWrapper(opacityOnlyLayer);

        expect(unsupportedWrapper.isOpacitySupported).toBe(false);
        expect(() => unsupportedWrapper.opacity).toThrow("XRCompositionLayer.opacity is not supported by this XR runtime.");
        expect(() => {
            unsupportedWrapper.opacity = 0.5;
        }).toThrow("XRCompositionLayer.opacity is not supported by this XR runtime.");
        expect(wrapper.isOpacitySupported).toBe(true);
        expect(wrapper.isQualitySupported).toBe(false);
        expect(wrapper.isForceMonoPresentationSupported).toBe(false);
        expect(() => wrapper.quality).toThrow("XRCompositionLayer.quality is not supported by this XR runtime.");
        expect(() => {
            wrapper.quality = "graphics-optimized";
        }).toThrow("XRCompositionLayer.quality is not supported by this XR runtime.");
        expect(() => wrapper.forceMonoPresentation).toThrow("XRCompositionLayer.forceMonoPresentation is not supported by this XR runtime.");
        expect(() => {
            wrapper.forceMonoPresentation = true;
        }).toThrow("XRCompositionLayer.forceMonoPresentation is not supported by this XR runtime.");
    });

    it("forwards native getters, values, and setter errors without replacing native validation", () => {
        const nativeError = new TypeError("native quality rejection");
        const getOpacity = vi.fn(() => 0.25);
        const setOpacity = vi.fn();
        const getQuality = vi.fn((): LayerQuality => "default");
        const setQuality = vi.fn(() => {
            throw nativeError;
        });
        const getForceMonoPresentation = vi.fn(() => false);
        const setForceMonoPresentation = vi.fn();
        const layer = Object.defineProperties(
            {},
            {
                opacity: { configurable: true, get: getOpacity, set: setOpacity },
                quality: { configurable: true, get: getQuality, set: setQuality },
                forceMonoPresentation: { configurable: true, get: getForceMonoPresentation, set: setForceMonoPresentation },
            }
        ) as CompositionLayer;
        const wrapper = createCompositionWrapper(layer);

        expect(wrapper.opacity).toBe(0.25);
        wrapper.opacity = 2;
        expect(getOpacity).toHaveBeenCalledOnce();
        expect(setOpacity).toHaveBeenCalledExactlyOnceWith(2);

        expect(wrapper.quality).toBe("default");
        expect(() => {
            wrapper.quality = "text-optimized";
        }).toThrow(nativeError);
        expect(getQuality).toHaveBeenCalledOnce();
        expect(setQuality).toHaveBeenCalledExactlyOnceWith("text-optimized");

        expect(wrapper.forceMonoPresentation).toBe(false);
        wrapper.forceMonoPresentation = true;
        expect(getForceMonoPresentation).toHaveBeenCalledOnce();
        expect(setForceMonoPresentation).toHaveBeenCalledExactlyOnceWith(true);
    });
});

describe("WebXR projection layer fixed foveation", () => {
    it("preserves XRWebGLLayer fixed-foveation behavior", () => {
        const layer = {
            fixedFoveation: 0.25,
            framebufferHeight: 512,
            framebufferWidth: 1024,
        } as XRWebGLLayer;
        const wrapper = new WebXRWebGLLayerWrapper(layer);

        expect(wrapper.isFixedFoveationSupported).toBe(true);
        expect(wrapper.fixedFoveation).toBe(0.25);
        wrapper.fixedFoveation = 2;
        expect(layer.fixedFoveation).toBe(1);
    });

    it.each(["WebGL", "WebGPU"])("supports fixed foveation on %s projection wrappers", (backend) => {
        const layer = createProjectionLayer(0.25);
        const wrapper =
            backend === "WebGL" ? new WebXRProjectionLayerWrapper(layer, false, {} as XRWebGLBinding) : new WebXRWebGPUProjectionLayerWrapper(layer, false, {} as GPUBinding);

        expect(wrapper.isFixedFoveationSupported).toBe(true);
        expect(wrapper.fixedFoveation).toBe(0.25);
        wrapper.fixedFoveation = -1;
        expect(layer.fixedFoveation).toBe(0);
    });

    it("reports nullable native projection foveation as unsupported and preserves the native no-op", () => {
        const layer = createProjectionLayer(null);
        const wrapper = new WebXRProjectionLayerWrapper(layer, false, {} as XRWebGLBinding);

        expect(wrapper.isFixedFoveationSupported).toBe(false);
        expect(wrapper.fixedFoveation).toBeNull();
        wrapper.fixedFoveation = 0.5;
        expect(layer.fixedFoveation).toBeNull();
    });
});
