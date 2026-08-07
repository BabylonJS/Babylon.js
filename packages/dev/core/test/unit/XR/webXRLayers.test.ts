/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { WebXRCompositionLayerWrapper } from "core/XR/features/Layers/WebXRCompositionLayer";
import { WebXRWebGPUCompositionLayerWrapper } from "core/XR/features/Layers/WebXRWebGPUCompositionLayer";
import { WebXRLayers } from "core/XR/features/WebXRLayers";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface ProjectionLayerBindingConstructor {
    prototype: {
        createProjectionLayer?: () => void;
    };
}

type TestGlobals = typeof globalThis & {
    XRGPUBinding?: ProjectionLayerBindingConstructor;
    XRWebGLBinding?: ProjectionLayerBindingConstructor;
    XRRigidTransform?: typeof XRRigidTransform;
};

const WebGPUQuadLayerCreateWarning =
    "WebGPU XR quad layers are unavailable because XRGPUBinding.createQuadLayer is not supported; the requested quad layer was skipped and projection rendering remains active.";
const WebGPUQuadLayerSubImageWarning =
    "WebGPU XR quad layers are unavailable because XRGPUBinding.getSubImage is not supported; the requested quad layer was skipped and projection rendering remains active.";

describe("WebXRLayers", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    const testGlobals = globalThis as TestGlobals;
    let originalGPUBinding: ProjectionLayerBindingConstructor | undefined;
    let originalWebGLBinding: ProjectionLayerBindingConstructor | undefined;
    let originalRigidTransform: typeof XRRigidTransform | undefined;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
        (sessionManager as any)._xrNavigator = { xr: { native: false } };
        originalGPUBinding = testGlobals.XRGPUBinding;
        originalWebGLBinding = testGlobals.XRWebGLBinding;
        originalRigidTransform = testGlobals.XRRigidTransform;
        testGlobals.XRRigidTransform = vi.fn(function () {}) as unknown as typeof XRRigidTransform;
    });

    afterEach(() => {
        if (originalGPUBinding) {
            testGlobals.XRGPUBinding = originalGPUBinding;
        } else {
            delete testGlobals.XRGPUBinding;
        }
        if (originalWebGLBinding) {
            testGlobals.XRWebGLBinding = originalWebGLBinding;
        } else {
            delete testGlobals.XRWebGLBinding;
        }
        if (originalRigidTransform) {
            testGlobals.XRRigidTransform = originalRigidTransform;
        } else {
            delete testGlobals.XRRigidTransform;
        }
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    function setEnvironment(isNative: boolean, isWebGPU: boolean): void {
        vi.spyOn(sessionManager, "isNative", "get").mockReturnValue(isNative);
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(isWebGPU);
    }

    function installGPUBinding(): void {
        const binding = vi.fn() as unknown as ProjectionLayerBindingConstructor;
        binding.prototype.createProjectionLayer = vi.fn();
        testGlobals.XRGPUBinding = binding;
    }

    function installWebGLBinding(): void {
        const binding = vi.fn() as unknown as ProjectionLayerBindingConstructor;
        binding.prototype.createProjectionLayer = vi.fn();
        testGlobals.XRWebGLBinding = binding;
    }

    function initializeSession(): ReturnType<typeof vi.fn> {
        const updateRenderState = vi.fn();
        sessionManager.session = {
            enabledFeatures: ["layers"],
            renderState: {},
            updateRenderState,
            end: vi.fn(),
        } as unknown as XRSession;
        sessionManager.inXRSession = true;
        sessionManager.referenceSpace = { name: "reference" } as unknown as XRReferenceSpace;
        sessionManager.viewerReferenceSpace = { name: "viewer" } as unknown as XRReferenceSpace;
        return updateRenderState;
    }

    function addBabylonLayer(texture: object): void {
        scene.layers.push({
            texture,
            renderTargetTextures: [],
            renderOnlyInRenderTargetTextures: false,
        } as any);
    }

    describe("isCompatible", () => {
        it("accepts native WebGPU when XRGPUBinding exposes projection layers", () => {
            setEnvironment(true, true);
            installGPUBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(true);
        });

        it("rejects native WebGPU when XRGPUBinding is absent", () => {
            setEnvironment(true, true);
            delete testGlobals.XRGPUBinding;

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(false);
        });

        it("keeps native WebGL on the legacy render-target path", () => {
            setEnvironment(true, false);
            installWebGLBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(false);
        });

        it("accepts browser WebGPU when XRGPUBinding exposes projection layers", () => {
            setEnvironment(false, true);
            installGPUBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(true);
        });

        it("accepts browser WebGL when XRWebGLBinding exposes projection layers", () => {
            setEnvironment(false, false);
            installWebGLBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(true);
        });
    });

    describe("quad layers", () => {
        it("reuses the cached WebGL binding and preserves the native projection and quad init dictionaries", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const quadLayer = { width: 0, height: 0 };
            const createProjectionLayer = vi.fn(() => projectionLayer);
            const createQuadLayer = vi.fn(() => quadLayer);
            const nativeBinding = { createProjectionLayer, createQuadLayer, getSubImage: vi.fn() };
            const xrWebGLBinding = vi.fn().mockImplementation(function () {
                return nativeBinding;
            });
            testGlobals.XRWebGLBinding = xrWebGLBinding as unknown as ProjectionLayerBindingConstructor;
            const glContext = {} as WebGLRenderingContext;
            (engine as any)._gl = glContext;
            initializeSession();
            const feature = new WebXRLayers(sessionManager, { projectionLayerInit: { scaleFactor: 0.75 } });

            expect(feature.attach()).toBe(true);

            const texture = {};
            addBabylonLayer(texture);
            const wrapper = feature.addFullscreenAdvancedDynamicTexture(texture as any);

            expect(wrapper).toBeInstanceOf(WebXRCompositionLayerWrapper);
            expect(wrapper).not.toBeInstanceOf(WebXRWebGPUCompositionLayerWrapper);
            expect(xrWebGLBinding).toHaveBeenCalledExactlyOnceWith(sessionManager.session, glContext);
            expect(sessionManager._getGraphicsBinding().binding).toBe(nativeBinding);
            expect(xrWebGLBinding).toHaveBeenCalledTimes(1);
            expect(createProjectionLayer).toHaveBeenCalledExactlyOnceWith({
                textureType: "texture",
                colorFormat: 0x1908,
                depthFormat: 0x88f0,
                scaleFactor: 0.75,
                clearOnAccess: false,
            });
            expect(createQuadLayer).toHaveBeenCalledExactlyOnceWith({
                space: sessionManager.viewerReferenceSpace,
                viewPixelWidth: 1024,
                viewPixelHeight: 512,
                clearOnAccess: true,
                textureType: "texture",
                layout: "mono",
            });
            expect(quadLayer.width).toBe(2);
            expect(quadLayer.height).toBe(1);
        });

        it("uses native WebGPU quad creation with explicit render-attachment usage", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const quadLayer = { width: 0, height: 0 };
            const createProjectionLayer = vi.fn(() => projectionLayer);
            const createQuadLayer = vi.fn(() => quadLayer);
            const nativeBinding = {
                createProjectionLayer,
                createQuadLayer,
                getSubImage: vi.fn(),
                getPreferredColorFormat: vi.fn(() => "rgba8unorm"),
            };
            testGlobals.XRGPUBinding = vi.fn().mockImplementation(function () {
                return nativeBinding;
            }) as unknown as ProjectionLayerBindingConstructor;
            (engine as any)._isWebGPU = true;
            (engine as any)._device = {};
            initializeSession();
            const feature = new WebXRLayers(sessionManager);

            expect(feature.attach()).toBe(true);

            const texture = {};
            addBabylonLayer(texture);
            const wrapper = feature.addFullscreenAdvancedDynamicTexture(texture as any);

            expect(wrapper).toBeInstanceOf(WebXRWebGPUCompositionLayerWrapper);
            expect(wrapper).toBeInstanceOf(WebXRCompositionLayerWrapper);
            expect(createQuadLayer).toHaveBeenCalledExactlyOnceWith({
                colorFormat: "rgba8unorm",
                textureUsage: 0x10,
                space: sessionManager.viewerReferenceSpace,
                viewPixelWidth: 1024,
                viewPixelHeight: 512,
                layout: "mono",
            });
            expect(quadLayer.width).toBe(2);
            expect(quadLayer.height).toBe(1);
        });

        it("skips only the WebGPU quad path when createQuadLayer is unavailable", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const nativeBinding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
                getSubImage: vi.fn(),
                getPreferredColorFormat: vi.fn(() => "rgba8unorm"),
            };
            testGlobals.XRGPUBinding = vi.fn().mockImplementation(function () {
                return nativeBinding;
            }) as unknown as ProjectionLayerBindingConstructor;
            (engine as any)._isWebGPU = true;
            (engine as any)._device = {};
            const updateRenderState = initializeSession();
            const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
            const feature = new WebXRLayers(sessionManager);

            expect(feature.attach()).toBe(true);
            expect(feature.addFullscreenAdvancedDynamicTexture({} as any)).toBeNull();
            expect(feature.attached).toBe(true);
            expect(warnSpy).toHaveBeenCalledExactlyOnceWith(WebGPUQuadLayerCreateWarning);
            expect(updateRenderState).toHaveBeenCalledTimes(1);
            expect(updateRenderState.mock.calls[0][0].layers).toEqual([projectionLayer]);
        });

        it("skips only the WebGPU quad path when getSubImage is unavailable", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const createQuadLayer = vi.fn();
            const nativeBinding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
                createQuadLayer,
                getPreferredColorFormat: vi.fn(() => "rgba8unorm"),
            };
            testGlobals.XRGPUBinding = vi.fn().mockImplementation(function () {
                return nativeBinding;
            }) as unknown as ProjectionLayerBindingConstructor;
            (engine as any)._isWebGPU = true;
            (engine as any)._device = {};
            const updateRenderState = initializeSession();
            const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
            const feature = new WebXRLayers(sessionManager);

            expect(feature.attach()).toBe(true);
            expect(feature.addFullscreenAdvancedDynamicTexture({} as any)).toBeNull();
            expect(feature.attached).toBe(true);
            expect(createQuadLayer).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledExactlyOnceWith(WebGPUQuadLayerSubImageWarning);
            expect(updateRenderState).toHaveBeenCalledTimes(1);
            expect(updateRenderState.mock.calls[0][0].layers).toEqual([projectionLayer]);
        });
    });
});
