/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import "core/Engines/Extensions/engine.multiview";
import { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { type RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Viewport } from "core/Maths/math.viewport";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { XRSpaceWarpRenderTarget, WebXRSpaceWarp, WebXRSpaceWarpRenderTargetTextureProvider } from "core/XR/features/WebXRSpaceWarp";
import { WebXRLayers } from "core/XR/features/WebXRLayers";
import { WebXRFeaturesManager } from "core/XR/webXRFeaturesManager";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const WebGPUWarning = "WebXR Space Warp is unavailable with WebGPU XR because this runtime does not expose usable motion-vector/depth sub-images; the feature was disabled.";

class TestWebXRSpaceWarpRenderTargetTextureProvider extends WebXRSpaceWarpRenderTargetTextureProvider {
    public readonly renderTargetTexture = { dispose: vi.fn() } as unknown as RenderTargetTexture;
    public readonly createRenderTargetTexture = vi.fn();

    protected override _createRenderTargetTexture(
        width: number,
        height: number,
        framebuffer: WebGLFramebuffer | null,
        motionVectorTexture: WebGLTexture,
        depthStencilTexture: WebGLTexture
    ): RenderTargetTexture {
        this.createRenderTargetTexture(width, height, framebuffer, motionVectorTexture, depthStencilTexture);
        return this.renderTargetTexture;
    }
}

describe("WebXRSpaceWarp", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let originalWebGLBinding: unknown;
    let originalGPUBinding: unknown;
    let originalGPUSubImage: unknown;

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
        (sessionManager as unknown as { _xrNavigator: unknown })._xrNavigator = { xr: { native: false } };
        originalWebGLBinding = (globalThis as unknown as { XRWebGLBinding?: unknown }).XRWebGLBinding;
        originalGPUBinding = (globalThis as unknown as { XRGPUBinding?: unknown }).XRGPUBinding;
        originalGPUSubImage = (globalThis as unknown as { XRGPUSubImage?: unknown }).XRGPUSubImage;
        const subImage = vi.fn();
        subImage.prototype.getViewDescriptor = vi.fn();
        (globalThis as unknown as { XRGPUSubImage: unknown }).XRGPUSubImage = subImage;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        (globalThis as unknown as { XRWebGLBinding?: unknown }).XRWebGLBinding = originalWebGLBinding;
        (globalThis as unknown as { XRGPUBinding?: unknown }).XRGPUBinding = originalGPUBinding;
        (globalThis as unknown as { XRGPUSubImage?: unknown }).XRGPUSubImage = originalGPUSubImage;
        scene.dispose();
        engine.dispose();
    });

    it("disables once on WebGPU before creating bindings, render targets, framebuffers, or observers", () => {
        const xrWebGLBinding = vi.fn();
        const xrGPUBinding = vi.fn();
        (globalThis as unknown as { XRWebGLBinding: unknown }).XRWebGLBinding = xrWebGLBinding;
        (globalThis as unknown as { XRGPUBinding: unknown }).XRGPUBinding = xrGPUBinding;
        (engine as unknown as { _isWebGPU: boolean })._isWebGPU = true;
        (engine as unknown as { _device: GPUDevice })._device = {} as GPUDevice;
        sessionManager.session = {} as XRSession;

        const getGraphicsBindingSpy = vi.spyOn(sessionManager, "_getGraphicsBinding");
        const createMultiviewRenderTargetTextureSpy = vi.spyOn(engine, "createMultiviewRenderTargetTexture");
        const bindSpaceWarpFramebufferSpy = vi.spyOn(engine, "bindSpaceWarpFramebuffer");
        const frameObserverSpy = vi.spyOn(sessionManager.onXRFrameObservable, "add");
        const afterRenderObserverSpy = vi.spyOn(scene.onAfterRenderObservable, "add");
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const feature = new WebXRSpaceWarp(sessionManager);
        const featuresManager = new WebXRFeaturesManager(sessionManager);
        (
            featuresManager as unknown as {
                _features: Record<string, { featureImplementation: WebXRSpaceWarp; enabled: boolean; version: number; required: boolean }>;
            }
        )._features[WebXRSpaceWarp.Name] = {
            featureImplementation: feature,
            enabled: true,
            version: 1,
            required: false,
        };

        featuresManager.attachFeature(WebXRSpaceWarp.Name);

        expect(feature.attached).toBe(false);
        expect(feature.disableAutoAttach).toBe(true);
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(WebGPUWarning);
        expect(getGraphicsBindingSpy).not.toHaveBeenCalled();
        expect(xrGPUBinding).not.toHaveBeenCalled();
        expect(xrWebGLBinding).not.toHaveBeenCalled();
        expect(createMultiviewRenderTargetTextureSpy).not.toHaveBeenCalled();
        expect(bindSpaceWarpFramebufferSpy).not.toHaveBeenCalled();
        expect(frameObserverSpy).not.toHaveBeenCalled();
        expect(afterRenderObserverSpy).not.toHaveBeenCalled();
        expect(feature.spaceWarpRTTProvider).toBeUndefined();
        expect(scene.needsPreviousWorldMatrices).toBe(false);

        sessionManager.onXRSessionInit.notifyObservers(sessionManager.session);
        expect(warnSpy).toHaveBeenCalledTimes(1);

        featuresManager.dispose();
    });

    it("disables before WebGPU session creation without requesting native Space Warp or disturbing projection layers", async () => {
        const projectionLayer = {};
        const getPreferredColorFormat = vi.fn(() => "rgba8unorm");
        const createProjectionLayer = vi.fn(() => projectionLayer);
        const xrGPUBinding = vi.fn().mockImplementation(function () {
            return {
                getPreferredColorFormat,
                createProjectionLayer,
            };
        });
        xrGPUBinding.prototype.createProjectionLayer = createProjectionLayer;
        xrGPUBinding.prototype.getViewSubImage = vi.fn();
        xrGPUBinding.prototype.getPreferredColorFormat = getPreferredColorFormat;
        (globalThis as unknown as { XRGPUBinding: unknown }).XRGPUBinding = xrGPUBinding;
        (engine as unknown as { _isWebGPU: boolean })._isWebGPU = true;
        (engine as unknown as { _device: GPUDevice })._device = {} as GPUDevice;
        const featuresManager = new WebXRFeaturesManager(sessionManager);
        const layers = featuresManager.enableFeature(WebXRLayers.Name, 1, { preferMultiviewOnInit: false }, true, false);
        const getGraphicsBindingSpy = vi.spyOn(sessionManager, "_getGraphicsBinding");
        const createMultiviewRenderTargetTextureSpy = vi.spyOn(engine, "createMultiviewRenderTargetTexture");
        const bindSpaceWarpFramebufferSpy = vi.spyOn(engine, "bindSpaceWarpFramebuffer");
        const frameObserverSpy = vi.spyOn(sessionManager.onXRFrameObservable, "add");
        const afterRenderObserverSpy = vi.spyOn(scene.onAfterRenderObservable, "add");
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        const feature = featuresManager.enableFeature(WebXRSpaceWarp.Name, 1, undefined, true, false);
        const sessionInit = await featuresManager._extendXRSessionInitObject({ optionalFeatures: ["local-floor"] });

        expect(feature.attached).toBe(false);
        expect(feature.disableAutoAttach).toBe(true);
        expect(featuresManager.getEnabledFeature(WebXRSpaceWarp.Name)).toBeUndefined();
        expect(sessionInit.optionalFeatures).toEqual(["local-floor", "layers"]);
        expect(sessionInit.requiredFeatures).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(WebGPUWarning);
        expect(getGraphicsBindingSpy).not.toHaveBeenCalled();
        expect(createMultiviewRenderTargetTextureSpy).not.toHaveBeenCalled();
        expect(bindSpaceWarpFramebufferSpy).not.toHaveBeenCalled();
        expect(frameObserverSpy).not.toHaveBeenCalled();
        expect(afterRenderObserverSpy).not.toHaveBeenCalled();
        expect(scene.needsPreviousWorldMatrices).toBe(false);
        expect(feature.spaceWarpRTTProvider).toBeUndefined();

        expect(feature.attach()).toBe(false);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(getGraphicsBindingSpy).not.toHaveBeenCalled();
        expect(frameObserverSpy).not.toHaveBeenCalled();
        expect(afterRenderObserverSpy).not.toHaveBeenCalled();

        const updateRenderState = vi.fn();
        sessionManager.session = {
            enabledFeatures: ["layers"],
            renderState: {},
            updateRenderState,
        } as unknown as XRSession;
        sessionManager.inXRSession = true;
        sessionManager.onXRSessionInit.notifyObservers(sessionManager.session);

        expect(layers.attached).toBe(true);
        expect(sessionManager._getBaseLayerWrapper()?.layerType).toBe("XRProjectionLayer");
        expect(getGraphicsBindingSpy).toHaveBeenCalledTimes(1);
        expect(xrGPUBinding).toHaveBeenCalledExactlyOnceWith(sessionManager.session, {});
        expect(getPreferredColorFormat).toHaveBeenCalledTimes(1);
        expect(createProjectionLayer).toHaveBeenCalledTimes(1);
        expect(updateRenderState).toHaveBeenCalledTimes(1);
        expect(feature.attached).toBe(false);
        expect(feature.disableAutoAttach).toBe(true);
        expect(feature.spaceWarpRTTProvider).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(scene.needsPreviousWorldMatrices).toBe(false);

        sessionManager.inXRSession = false;
        featuresManager.dispose();
    });

    it("reuses the cached WebGL binding when attaching", () => {
        const nativeBinding = { getViewSubImage: vi.fn() };
        const xrWebGLBinding = vi.fn().mockImplementation(function () {
            return nativeBinding;
        });
        const glContext = {} as WebGLRenderingContext;
        (globalThis as unknown as { XRWebGLBinding: unknown }).XRWebGLBinding = xrWebGLBinding;
        (engine as unknown as { _gl: WebGLRenderingContext })._gl = glContext;
        sessionManager.session = {
            enabledFeatures: ["space-warp"],
        } as XRSession;
        const feature = new WebXRSpaceWarp(sessionManager);

        expect(feature.attach()).toBe(true);
        expect(xrWebGLBinding).toHaveBeenCalledExactlyOnceWith(sessionManager.session, glContext);
        expect(sessionManager._getGraphicsBinding().binding).toBe(nativeBinding);
        expect(
            (
                feature.spaceWarpRTTProvider as unknown as {
                    _xrWebGLBinding: XRWebGLBinding;
                }
            )._xrWebGLBinding
        ).toBe(nativeBinding);
        expect(sessionManager.onXRFrameObservable.hasObservers()).toBe(true);
        expect(scene.onAfterRenderObservable.hasObservers()).toBe(true);
        expect(scene.needsPreviousWorldMatrices).toBe(true);

        expect(feature.detach()).toBe(true);
        expect(sessionManager.onXRFrameObservable.hasObservers()).toBe(false);
        expect(scene.onAfterRenderObservable.hasObservers()).toBe(false);
    });

    it("keeps the native projection-layer sub-image provider behavior", () => {
        const projectionLayer = {};
        const view = { eye: "left" } as XRView;
        const motionVectorTexture = {} as WebGLTexture;
        const depthStencilTexture = {} as WebGLTexture;
        const subImage = {
            motionVectorTexture,
            motionVectorTextureWidth: 640,
            motionVectorTextureHeight: 480,
            depthStencilTexture,
        };
        const nativeBinding = {
            getViewSubImage: vi.fn(() => subImage),
        } as unknown as XRWebGLBinding;
        (
            sessionManager as unknown as {
                _baseLayerWrapper: { layerType: "XRProjectionLayer"; layer: object };
            }
        )._baseLayerWrapper = {
            layerType: "XRProjectionLayer",
            layer: projectionLayer,
        };
        const provider = new TestWebXRSpaceWarpRenderTargetTextureProvider(scene, sessionManager, nativeBinding);

        expect(provider.getRenderTargetTextureForView(view)).toBe(provider.renderTargetTexture);
        expect(nativeBinding.getViewSubImage).toHaveBeenCalledExactlyOnceWith(projectionLayer, view);
        expect(provider.createRenderTargetTexture).toHaveBeenCalledExactlyOnceWith(640, 480, null, motionVectorTexture, depthStencilTexture);

        const viewport = new Viewport(0, 0, 0, 0);
        expect(provider.trySetViewportForView(viewport, view)).toBe(true);
        expect(viewport).toMatchObject({ x: 0, y: 0, width: 640, height: 480 });
        expect(nativeBinding.getViewSubImage).toHaveBeenCalledTimes(1);
    });

    it("keeps the WebGL multiview render target and Space Warp framebuffer binding path", () => {
        const motionVectorTexture = {} as WebGLTexture;
        const depthStencilTexture = {} as WebGLTexture;
        const multiviewRenderTarget = new RenderTargetWrapper(false, false, { width: 640, height: 480 }, engine);
        const internalTexture = new InternalTexture(engine, InternalTextureSource.Unknown, true);
        internalTexture.width = internalTexture.baseWidth = 640;
        internalTexture.height = internalTexture.baseHeight = 480;
        multiviewRenderTarget.setTexture(internalTexture);
        const framebuffer = {} as WebGLFramebuffer;
        Object.assign(multiviewRenderTarget, {
            _framebuffer: framebuffer,
            _colorTextureArray: motionVectorTexture,
            _depthStencilTextureArray: depthStencilTexture,
        });
        const createMultiviewRenderTargetTextureSpy = vi.spyOn(engine, "createMultiviewRenderTargetTexture").mockReturnValue(multiviewRenderTarget);
        const bindSpaceWarpFramebufferSpy = vi.spyOn(engine, "bindSpaceWarpFramebuffer").mockImplementation(() => {});

        const renderTarget = new XRSpaceWarpRenderTarget(motionVectorTexture, depthStencilTexture, scene, { width: 640, height: 480 });

        expect(createMultiviewRenderTargetTextureSpy).toHaveBeenCalledExactlyOnceWith(640, 480, motionVectorTexture, depthStencilTexture);
        expect(renderTarget.renderTarget).toBe(multiviewRenderTarget);
        expect(
            renderTarget.renderTarget as unknown as {
                _disposeOnlyFramebuffers: boolean;
                _framebuffer: WebGLFramebuffer;
                _colorTextureArray: WebGLTexture;
                _depthStencilTextureArray: WebGLTexture;
            }
        ).toMatchObject({
            _disposeOnlyFramebuffers: true,
            _framebuffer: framebuffer,
            _colorTextureArray: motionVectorTexture,
            _depthStencilTextureArray: depthStencilTexture,
        });

        renderTarget._bindFrameBuffer();
        expect(bindSpaceWarpFramebufferSpy).toHaveBeenCalledExactlyOnceWith(multiviewRenderTarget);

        renderTarget.dispose();
    });
});
