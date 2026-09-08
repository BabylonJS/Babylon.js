/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { type StandardMaterial } from "core/Materials/standardMaterial.pure";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import {
    WebXRCompositionLayerRenderTargetTextureProvider,
    WebXRCompositionLayerWrapper,
    WebXRCubeLayerWrapper,
    WebXRMediaLayerWrapper,
    WebXRSpatialLayerWrapper,
} from "core/XR/features/Layers/WebXRCompositionLayer";
import { WebXRProjectionLayerWrapper } from "core/XR/features/Layers/WebXRProjectionLayer";
import { WebXRFallbackLayerWrapper } from "core/XR/features/WebXRLayersFallback";
import { WebXRWebGPUCompositionLayerWrapper } from "core/XR/features/Layers/WebXRWebGPUCompositionLayer";
import { WebXRLayers } from "core/XR/features/WebXRLayers";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface LayerBindingConstructor {
    prototype: {
        createProjectionLayer?: () => void;
        createQuadLayer?: () => void;
        createCylinderLayer?: () => void;
        createEquirectLayer?: () => void;
        createCubeLayer?: () => void;
        getSubImage?: () => void;
        getViewSubImage?: () => void;
        getPreferredColorFormat?: () => void;
    };
}

interface GPUSubImageConstructor {
    prototype: {
        getViewDescriptor?: () => void;
    };
}

interface MediaBindingConstructor {
    prototype: {
        createQuadLayer?: () => void;
        createCylinderLayer?: () => void;
        createEquirectLayer?: () => void;
    };
}

type TestGlobals = typeof globalThis & {
    XRGPUBinding?: LayerBindingConstructor;
    XRGPUSubImage?: GPUSubImageConstructor;
    XRWebGLBinding?: LayerBindingConstructor;
    XRMediaBinding?: MediaBindingConstructor;
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
    let originalGPUBinding: LayerBindingConstructor | undefined;
    let originalGPUSubImage: GPUSubImageConstructor | undefined;
    let originalWebGLBinding: LayerBindingConstructor | undefined;
    let originalMediaBinding: MediaBindingConstructor | undefined;
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
        originalGPUSubImage = testGlobals.XRGPUSubImage;
        originalWebGLBinding = testGlobals.XRWebGLBinding;
        originalMediaBinding = testGlobals.XRMediaBinding;
        originalRigidTransform = testGlobals.XRRigidTransform;
        testGlobals.XRRigidTransform = vi.fn(function (
            this: { position: DOMPointReadOnly; orientation: DOMPointReadOnly },
            position: { x?: number; y?: number; z?: number; w?: number } = {},
            orientation: { x?: number; y?: number; z?: number; w?: number } = {}
        ) {
            this.position = position as DOMPointReadOnly;
            this.orientation = orientation as DOMPointReadOnly;
        }) as unknown as typeof XRRigidTransform;
        const subImage = vi.fn() as unknown as GPUSubImageConstructor;
        subImage.prototype.getViewDescriptor = vi.fn();
        testGlobals.XRGPUSubImage = subImage;
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
        if (originalGPUSubImage) {
            testGlobals.XRGPUSubImage = originalGPUSubImage;
        } else {
            delete testGlobals.XRGPUSubImage;
        }
        if (originalMediaBinding) {
            testGlobals.XRMediaBinding = originalMediaBinding;
        } else {
            delete testGlobals.XRMediaBinding;
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
        const binding = vi.fn() as unknown as LayerBindingConstructor;
        binding.prototype.createProjectionLayer = vi.fn();
        binding.prototype.getViewSubImage = vi.fn();
        binding.prototype.getPreferredColorFormat = vi.fn();
        testGlobals.XRGPUBinding = binding;
    }

    function installWebGLBinding(): void {
        const binding = vi.fn() as unknown as LayerBindingConstructor;
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
        it("accepts native WebGPU when XRGPUBinding exposes the required projection path", () => {
            setEnvironment(true, true);
            installGPUBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(true);
        });

        it("rejects native WebGPU when XRGPUBinding is absent", () => {
            setEnvironment(true, true);
            delete testGlobals.XRGPUBinding;

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(false);
        });

        it.each(["createProjectionLayer", "getViewSubImage", "getPreferredColorFormat"] as const)("rejects WebGPU when XRGPUBinding.%s is absent", (methodName) => {
            setEnvironment(false, true);
            installGPUBinding();
            delete testGlobals.XRGPUBinding!.prototype[methodName];

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(false);
        });

        it("rejects WebGPU when XRGPUSubImage.getViewDescriptor is absent", () => {
            setEnvironment(false, true);
            installGPUBinding();
            delete testGlobals.XRGPUSubImage!.prototype.getViewDescriptor;

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(false);
        });

        it("keeps native WebGL on the legacy render-target path", () => {
            setEnvironment(true, false);
            installWebGLBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(false);
        });

        it("accepts browser WebGPU when XRGPUBinding exposes the required projection path", () => {
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

    describe("maxRenderLayers", () => {
        function createProjectionLayer(): WebXRProjectionLayerWrapper {
            const layer = { textureHeight: 512, textureWidth: 1024 } as ConstructorParameters<typeof WebXRProjectionLayerWrapper>[0];
            return new WebXRProjectionLayerWrapper(layer, false, {} as XRWebGLBinding);
        }

        function createWrappedLayer(): WebXRCompositionLayerWrapper {
            const layer = {} as ConstructorParameters<typeof WebXRCompositionLayerWrapper>[2];
            return new WebXRCompositionLayerWrapper(
                () => 1,
                () => 1,
                layer,
                "XRQuadLayer",
                false,
                () => {
                    throw new Error("Only the projection layer creates a render target provider in these tests.");
                }
            );
        }

        it("exposes the active session limit and rejects arrays that exceed it", () => {
            const updateRenderState = initializeSession();
            Object.defineProperty(sessionManager.session, "maxRenderLayers", { configurable: true, value: 2 });
            const feature = new WebXRLayers(sessionManager);
            const layers = [createProjectionLayer(), createWrappedLayer(), createWrappedLayer()];

            expect(feature.isMaxRenderLayersSupported).toBe(true);
            expect(feature.maxRenderLayers).toBe(2);
            feature.setXRSessionLayers(layers.slice(0, 2));
            expect(updateRenderState.mock.lastCall?.[0].layers).toEqual(layers.slice(0, 2).map((wrapper) => wrapper.layer));

            expect(() => feature.setXRSessionLayers(layers)).toThrow("The XR session supports at most 2 render layers, but 3 were provided.");
            expect(updateRenderState).toHaveBeenCalledTimes(1);
        });

        it("remains unsupported-aware and delegates layer limits when the native member is absent", () => {
            const updateRenderState = initializeSession();
            const feature = new WebXRLayers(sessionManager);
            const layers = [createProjectionLayer(), createWrappedLayer(), createWrappedLayer()];

            expect(feature.isMaxRenderLayersSupported).toBe(false);
            expect(feature.maxRenderLayers).toBeNull();
            expect(() => feature.setXRSessionLayers(layers)).not.toThrow();
            expect(updateRenderState.mock.lastCall?.[0].layers).toEqual(layers.map((wrapper) => wrapper.layer));
        });

        it("checks the active limit before creating another native layer", () => {
            const projectionLayer = { textureHeight: 512, textureWidth: 1024 };
            const createQuadLayer = vi.fn();
            const nativeBinding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
                createQuadLayer,
                getSubImage: vi.fn(),
            };
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return nativeBinding;
            }) as unknown as LayerBindingConstructor;
            Object.defineProperty(engine, "_gl", { configurable: true, value: {} });
            const updateRenderState = initializeSession();
            Object.defineProperty(sessionManager.session, "maxRenderLayers", { configurable: true, value: 1 });
            const feature = new WebXRLayers(sessionManager);

            expect(feature.attach()).toBe(true);
            expect(() => feature.createQuadLayer()).toThrow("The XR session supports at most 1 render layer, but 2 were provided.");
            expect(createQuadLayer).not.toHaveBeenCalled();
            expect(updateRenderState).toHaveBeenCalledTimes(1);
            expect(updateRenderState.mock.lastCall?.[0].layers).toEqual([projectionLayer]);
        });
    });

    describe("projection fixed foveation", () => {
        it("exposes XRProjectionLayer fixed foveation through the session manager convenience API", () => {
            const projectionLayer = { fixedFoveation: 0, textureHeight: 512, textureWidth: 1024 };
            const nativeBinding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
            };
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return nativeBinding;
            }) as unknown as LayerBindingConstructor;
            Object.defineProperty(engine, "_gl", { configurable: true, value: {} });
            initializeSession();
            const feature = new WebXRLayers(sessionManager);

            expect(feature.attach()).toBe(true);
            expect(sessionManager.isFixedFoveationSupported).toBe(true);
            expect(sessionManager.fixedFoveation).toBe(0);

            sessionManager.fixedFoveation = 0.5;
            expect(projectionLayer.fixedFoveation).toBe(0.5);
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
            testGlobals.XRWebGLBinding = xrWebGLBinding as unknown as LayerBindingConstructor;
            const glContext = {} as WebGLRenderingContext;
            (engine as any)._gl = glContext;
            initializeSession();
            sessionManager.worldScalingFactor = 2;
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
            expect(wrapper!.transformNode.position.z).toBe(3);
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
            }) as unknown as LayerBindingConstructor;
            (engine as any)._isWebGPU = true;
            (engine as any)._device = {};
            initializeSession();
            const feature = new WebXRLayers(sessionManager);

            expect(feature.attach()).toBe(true);

            const texture = {};
            addBabylonLayer(texture);
            const wrapper = feature.addFullscreenAdvancedDynamicTexture(texture as any);

            expect(wrapper).toBeInstanceOf(WebXRSpatialLayerWrapper);
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
            }) as unknown as LayerBindingConstructor;
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
            }) as unknown as LayerBindingConstructor;
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

    describe("spatial layer factories", () => {
        it("creates every graphics-backed spatial layer through the shared WebGL path", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const quadLayer = { layout: "mono", width: 1, height: 1, needsRedraw: true, destroy: vi.fn() };
            const cylinderLayer = { layout: "mono", radius: 2, centralAngle: Math.PI / 2, aspectRatio: 2, needsRedraw: true, destroy: vi.fn() };
            const equirectLayer = { layout: "mono", radius: 0, needsRedraw: true, destroy: vi.fn() };
            const cubeLayer = { layout: "mono", orientation: {}, needsRedraw: true, destroy: vi.fn() };
            const cubeSubImage = { colorTexture: {} };
            const binding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
                createQuadLayer: vi.fn(() => quadLayer),
                createCylinderLayer: vi.fn(() => cylinderLayer),
                createEquirectLayer: vi.fn(() => equirectLayer),
                createCubeLayer: vi.fn(() => cubeLayer),
                getSubImage: vi.fn(() => cubeSubImage),
            };
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return binding;
            }) as unknown as LayerBindingConstructor;
            (engine as any)._gl = {};
            const updateRenderState = initializeSession();
            const feature = new WebXRLayers(sessionManager);

            expect(feature.attach()).toBe(true);
            const quad = feature.createQuadLayer({ layerInit: { width: 1.5, height: 0.75 } });
            const cylinder = feature.createCylinderLayer({ layerInit: { radius: 3, centralAngle: 1, aspectRatio: 1.5 } });
            const equirect = feature.createEquirectLayer({ layerInit: { centralHorizontalAngle: Math.PI } });
            const cube = feature.createCubeLayer({ layerInit: { textureType: "texture-array" } });

            expect(quad).toBeInstanceOf(WebXRSpatialLayerWrapper);
            expect(cylinder).toBeInstanceOf(WebXRSpatialLayerWrapper);
            expect(equirect).toBeInstanceOf(WebXRSpatialLayerWrapper);
            expect(cube).toBeInstanceOf(WebXRCubeLayerWrapper);
            expect((cube as WebXRCubeLayerWrapper).renderTargetTextureProvider).toBeNull();
            const frame = {} as XRFrame;
            expect((cube as WebXRCubeLayerWrapper).getSubImage(frame)).toBe(cubeSubImage);
            expect(binding.getSubImage).toHaveBeenCalledWith(cubeLayer, frame, undefined);
            expect(binding.createQuadLayer).toHaveBeenCalledWith(expect.objectContaining({ width: 1.5, height: 0.75, viewPixelWidth: 1024, viewPixelHeight: 512 }));
            expect(binding.createCylinderLayer).toHaveBeenCalledWith(expect.objectContaining({ radius: 3, centralAngle: 1, aspectRatio: 1.5 }));
            expect(binding.createEquirectLayer).toHaveBeenCalledWith(expect.objectContaining({ centralHorizontalAngle: Math.PI }));
            expect(binding.createCubeLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    space: sessionManager.referenceSpace,
                    textureType: "texture-array",
                    viewPixelWidth: 512,
                    viewPixelHeight: 512,
                })
            );
            expect(updateRenderState.mock.lastCall?.[0].layers).toEqual([projectionLayer, quadLayer, cylinderLayer, equirectLayer, cubeLayer]);
            expect(() => feature.createCubeLayer({ layerInit: { viewPixelWidth: 256, viewPixelHeight: 128 } })).toThrow(
                "WebXR cube layer faces must have equal pixel width and height."
            );
        });

        it("translates shared initialization values for WebGPU cylinder, equirect, and cube layers", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const gpuSpace = { name: "gpu-space" } as unknown as XRReferenceSpace;
            const cylinderLayer = { layout: "mono", radius: 2, centralAngle: 1, aspectRatio: 2, space: gpuSpace, needsRedraw: true, destroy: vi.fn() };
            const equirectLayer = { layout: "mono", radius: 0, needsRedraw: true, destroy: vi.fn() };
            const cubeLayer = { layout: "mono", orientation: {}, needsRedraw: true, destroy: vi.fn() };
            const binding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
                createCylinderLayer: vi.fn(() => cylinderLayer),
                createEquirectLayer: vi.fn(() => equirectLayer),
                createCubeLayer: vi.fn(() => cubeLayer),
                getSubImage: vi.fn(),
                getPreferredColorFormat: vi.fn(() => "rgba8unorm"),
            };
            testGlobals.XRGPUBinding = vi.fn().mockImplementation(function () {
                return binding;
            }) as unknown as LayerBindingConstructor;
            (engine as any)._isWebGPU = true;
            (engine as any)._device = {};
            initializeSession();
            const feature = new WebXRLayers(sessionManager);
            feature.attach();

            const cylinder = feature.createCylinderLayer({
                layerInit: { radius: 3, centralAngle: 1.25, aspectRatio: 1.5, isStatic: true },
                gpuLayerInit: { depthStencilFormat: "depth24plus", space: gpuSpace, viewPixelWidth: 256 },
            });
            feature.createEquirectLayer({ layerInit: { radius: 4, centralHorizontalAngle: Math.PI } });
            feature.createCubeLayer();

            expect(binding.createCylinderLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    colorFormat: "rgba8unorm",
                    depthStencilFormat: "depth24plus",
                    textureUsage: 0x10,
                    space: gpuSpace,
                    viewPixelWidth: 256,
                    radius: 3,
                    centralAngle: 1.25,
                    aspectRatio: 1.5,
                    isStatic: true,
                })
            );
            expect(cylinder!.getWidth()).toBe(256);
            sessionManager.onXRReferenceSpaceChanged.notifyObservers({ name: "recentered" } as unknown as XRReferenceSpace);
            expect(cylinderLayer.space).toBe(gpuSpace);
            expect(binding.createEquirectLayer).toHaveBeenCalledWith(expect.objectContaining({ radius: 4, centralHorizontalAngle: Math.PI }));
            expect(binding.createCubeLayer).toHaveBeenCalledWith(expect.objectContaining({ colorFormat: "rgba8unorm", space: sessionManager.referenceSpace }));
            expect(() => feature.createCubeLayer({ gpuLayerInit: { viewPixelWidth: 256, viewPixelHeight: 128 } })).toThrow(
                "WebXR cube layer faces must have equal pixel width and height."
            );
            expect(binding.createCubeLayer).toHaveBeenCalledTimes(1);
        });

        it("updates only layers that use the session manager's default reference space", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const defaultSpaceLayer = { layout: "mono", width: 1, height: 1, space: sessionManager.referenceSpace, needsRedraw: true, destroy: vi.fn() };
            const explicitSpace = { name: "explicit" } as unknown as XRReferenceSpace;
            const explicitSpaceLayer = { layout: "mono", width: 1, height: 1, space: explicitSpace, needsRedraw: true, destroy: vi.fn() };
            const binding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
                createQuadLayer: vi.fn().mockReturnValueOnce(defaultSpaceLayer).mockReturnValueOnce(explicitSpaceLayer),
                getSubImage: vi.fn(),
            };
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return binding;
            }) as unknown as LayerBindingConstructor;
            (engine as any)._gl = {};
            initializeSession();
            const feature = new WebXRLayers(sessionManager);
            feature.attach();
            feature.createQuadLayer();
            feature.createQuadLayer({ layerInit: { space: explicitSpace } });

            const newReferenceSpace = { name: "recentered" } as unknown as XRReferenceSpace;
            sessionManager.onXRReferenceSpaceChanged.notifyObservers(newReferenceSpace);

            expect(defaultSpaceLayer.space).toBe(newReferenceSpace);
            expect(explicitSpaceLayer.space).toBe(explicitSpace);
        });

        it("removes and disposes native spatial layers without disturbing projection rendering", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const quadLayer = { layout: "mono", width: 1, height: 1, needsRedraw: true, destroy: vi.fn() };
            const binding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
                createQuadLayer: vi.fn(() => quadLayer),
                getSubImage: vi.fn(),
            };
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return binding;
            }) as unknown as LayerBindingConstructor;
            (engine as any)._gl = {};
            const updateRenderState = initializeSession();
            const feature = new WebXRLayers(sessionManager);
            feature.attach();
            const wrapper = feature.createQuadLayer() as WebXRSpatialLayerWrapper;
            const ownedTransformNode = wrapper.transformNode;

            expect(feature.removeLayer(wrapper)).toBe(true);

            expect(updateRenderState.mock.lastCall?.[0].layers).toEqual([projectionLayer]);
            expect(quadLayer.destroy).toHaveBeenCalledOnce();
            expect(ownedTransformNode.isDisposed()).toBe(true);
            expect(feature.removeLayer(wrapper)).toBe(false);
        });

        it("synchronizes transform-node world transforms into native layer coordinates", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const quadLayer = { layout: "mono", width: 1, height: 1, needsRedraw: true, destroy: vi.fn() };
            const binding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
                createQuadLayer: vi.fn(() => quadLayer),
                getSubImage: vi.fn(),
            };
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return binding;
            }) as unknown as LayerBindingConstructor;
            (engine as any)._gl = {};
            initializeSession();
            const feature = new WebXRLayers(sessionManager);
            feature.attach();
            const wrapper = feature.createQuadLayer();
            expect(wrapper).toBeInstanceOf(WebXRSpatialLayerWrapper);
            const nativeWrapper = wrapper as WebXRSpatialLayerWrapper;

            nativeWrapper.transformNode.position.set(1, 2, 3);
            sessionManager.onXRFrameObservable.notifyObservers({ getViewerPose: vi.fn() } as unknown as XRFrame);

            expect(quadLayer).toHaveProperty("transform");
            const transform = (quadLayer as typeof quadLayer & { transform: XRRigidTransform }).transform;
            expect(transform.position).toMatchObject({ x: 1, y: 2, z: -3 });
            expect(transform.orientation.x).toBeCloseTo(0);
            expect(transform.orientation.y).toBeCloseTo(0);
            expect(transform.orientation.z).toBeCloseTo(0);
            expect(transform.orientation.w).toBeCloseTo(-1);
        });

        it("creates media layers without allocating a render target provider", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const quadLayer = { layout: "mono", width: 1, height: 1, needsRedraw: true, destroy: vi.fn() };
            const cylinderLayer = { layout: "mono", radius: 2, centralAngle: 1, aspectRatio: 2, needsRedraw: true, destroy: vi.fn() };
            const equirectLayer = { layout: "mono", radius: 0, needsRedraw: true, destroy: vi.fn() };
            const graphicsBinding = { createProjectionLayer: vi.fn(() => projectionLayer) };
            const createQuadLayer = vi.fn(() => quadLayer);
            const createCylinderLayer = vi.fn(() => cylinderLayer);
            const createEquirectLayer = vi.fn(() => equirectLayer);
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return graphicsBinding;
            }) as unknown as LayerBindingConstructor;
            testGlobals.XRMediaBinding = vi.fn().mockImplementation(function () {
                return { createQuadLayer, createCylinderLayer, createEquirectLayer };
            }) as unknown as MediaBindingConstructor;
            (engine as any)._gl = {};
            initializeSession();
            const feature = new WebXRLayers(sessionManager);
            feature.attach();
            const video = document.createElement("video");

            const quad = feature.createMediaQuadLayer(video, { layerInit: { width: 2, height: 1 } });
            const cylinder = feature.createMediaCylinderLayer(video, { layerInit: { radius: 3, centralAngle: 1.5 } });
            const equirect = feature.createMediaEquirectLayer(video, { layerInit: { centralHorizontalAngle: Math.PI } });

            expect(quad).toBeInstanceOf(WebXRMediaLayerWrapper);
            expect(cylinder).toBeInstanceOf(WebXRMediaLayerWrapper);
            expect(equirect).toBeInstanceOf(WebXRMediaLayerWrapper);
            expect((quad as WebXRMediaLayerWrapper).renderTargetTextureProvider).toBeNull();
            expect(createQuadLayer).toHaveBeenCalledWith(video, expect.objectContaining({ width: 2, height: 1, space: sessionManager.referenceSpace }));
            expect(createCylinderLayer).toHaveBeenCalledWith(video, expect.objectContaining({ radius: 3, centralAngle: 1.5 }));
            expect(createEquirectLayer).toHaveBeenCalledWith(video, expect.objectContaining({ centralHorizontalAngle: Math.PI }));
        });

        it("uses an opt-in mesh fallback without changing the XR render-state layers", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const graphicsBinding = { createProjectionLayer: vi.fn(() => projectionLayer) };
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return graphicsBinding;
            }) as unknown as LayerBindingConstructor;
            (engine as any)._gl = {};
            const updateRenderState = initializeSession();
            sessionManager.worldScalingFactor = 2;
            const feature = new WebXRLayers(sessionManager);
            feature.attach();

            const fallbackTexture = new DynamicTexture("fallback", { width: 1, height: 1 }, scene);
            const disposeTexture = vi.spyOn(fallbackTexture, "dispose");
            const wrapper = feature.createCylinderLayer({
                fallbackMode: "mesh",
                fallbackTexture,
                layerInit: { radius: 2, centralAngle: Math.PI, aspectRatio: 2 },
            });

            expect(wrapper).toBeInstanceOf(WebXRFallbackLayerWrapper);
            expect((wrapper as WebXRFallbackLayerWrapper).layer).toBeNull();
            expect((wrapper as WebXRFallbackLayerWrapper).mesh.scaling.asArray()).toEqual([2, 2, 2]);
            expect(((wrapper as WebXRFallbackLayerWrapper).mesh.material as StandardMaterial).emissiveColor.asArray()).toEqual([0, 0, 0]);
            expect(updateRenderState).toHaveBeenCalledTimes(1);
            expect(feature.removeLayer(wrapper!)).toBe(true);
            expect((wrapper as WebXRFallbackLayerWrapper).mesh.isDisposed()).toBe(true);
            expect(disposeTexture).not.toHaveBeenCalled();

            fallbackTexture.getInternalTexture()!.isCube = true;
            vi.spyOn(fallbackTexture, "clone").mockReturnValue(null);
            const cubeWrapper = feature.createCubeLayer({
                fallbackMode: "mesh",
                fallbackTexture,
            }) as WebXRFallbackLayerWrapper;
            cubeWrapper.transformNode.position.set(1, 2, 3);
            sessionManager.onXRFrameObservable.notifyObservers({ getViewerPose: vi.fn() } as unknown as XRFrame);

            expect(cubeWrapper.mesh.position.asArray()).toEqual([0, 0, 0]);
            expect(feature.removeLayer(cubeWrapper)).toBe(true);
            fallbackTexture.dispose();
        });

        it("removes fullscreen ADT render callbacks and render-target references with the layer", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const quadLayer = { layout: "mono", width: 0, height: 0, needsRedraw: true, destroy: vi.fn() };
            const binding = {
                createProjectionLayer: vi.fn(() => projectionLayer),
                createQuadLayer: vi.fn(() => quadLayer),
                getSubImage: vi.fn(),
            };
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return binding;
            }) as unknown as LayerBindingConstructor;
            (engine as any)._gl = {};
            initializeSession();
            const feature = new WebXRLayers(sessionManager);
            feature.attach();
            const texture = {};
            addBabylonLayer(texture);
            const wrapper = feature.addFullscreenAdvancedDynamicTexture(texture as any)!;
            const provider = wrapper.renderTargetTextureProvider as WebXRCompositionLayerRenderTargetTextureProvider;
            const renderTargetTexture = new RenderTargetTexture("fullscreen ADT test", 1, scene);
            const render = vi.spyOn(renderTargetTexture, "render").mockImplementation(() => {});

            provider.onRenderTargetTextureCreatedObservable.notifyObservers({ texture: renderTargetTexture, eye: "none" });
            scene.onBeforeRenderObservable.notifyObservers(scene);

            const babylonLayer = scene.layers[0];
            expect(babylonLayer.renderTargetTextures).toEqual([renderTargetTexture]);
            expect(babylonLayer.renderOnlyInRenderTargetTextures).toBe(true);
            expect(render).toHaveBeenCalledOnce();

            expect(feature.removeXRSessionLayer(wrapper)).toBe(true);
            scene.onBeforeRenderObservable.notifyObservers(scene);

            expect(babylonLayer.renderTargetTextures).toEqual([]);
            expect(babylonLayer.renderOnlyInRenderTargetTextures).toBe(false);
            expect(render).toHaveBeenCalledOnce();
            renderTargetTexture.dispose();
        });

        it("uses a Babylon VideoTexture for media fallbacks without taking control of playback", () => {
            const projectionLayer = { textureWidth: 1024, textureHeight: 512 };
            const graphicsBinding = { createProjectionLayer: vi.fn(() => projectionLayer) };
            testGlobals.XRWebGLBinding = vi.fn().mockImplementation(function () {
                return graphicsBinding;
            }) as unknown as LayerBindingConstructor;
            delete testGlobals.XRMediaBinding;
            (engine as any)._gl = {};
            initializeSession();
            const feature = new WebXRLayers(sessionManager);
            feature.attach();
            const video = document.createElement("video");
            Object.defineProperties(video, {
                readyState: { value: video.HAVE_CURRENT_DATA },
                videoWidth: { value: 2 },
                videoHeight: { value: 2 },
            });
            const playSpy = vi.spyOn(video, "play");

            const wrapper = feature.createMediaQuadLayer(video, { fallbackMode: "mesh" });

            expect(wrapper).toBeInstanceOf(WebXRFallbackLayerWrapper);
            expect((wrapper as WebXRFallbackLayerWrapper).texture.getClassName()).toBe("VideoTexture");
            expect(playSpy).not.toHaveBeenCalled();
        });
    });
});
