/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { WebXRDepthSensing } from "core/XR/features/WebXRDepthSensing";
import { WebXRFeaturesManager } from "core/XR/webXRFeaturesManager";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const WebGPUGPUDepthWarning =
    "WebXR Depth Sensing is unavailable with WebGPU XR when the session negotiates gpu-optimized depth because XRGPUBinding has no environment-depth equivalent; request cpu-optimized depth to use the feature.";

describe("WebXRDepthSensing", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let feature: WebXRDepthSensing | undefined;
    let originalWebGLBinding: unknown;
    let originalGPUBinding: unknown;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 4,
            renderWidth: 4,
            textureSize: 4,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
        (sessionManager as any)._xrNavigator = { xr: { native: false } };
        originalWebGLBinding = (globalThis as any).XRWebGLBinding;
        originalGPUBinding = (globalThis as any).XRGPUBinding;
    });

    afterEach(() => {
        feature?.dispose();
        vi.restoreAllMocks();
        (globalThis as any).XRWebGLBinding = originalWebGLBinding;
        (globalThis as any).XRGPUBinding = originalGPUBinding;
        scene.dispose();
        engine.dispose();
    });

    it("updates CPU depth buffers, metadata, and the depth texture on WebGPU without a graphics binding", () => {
        const xrWebGLBinding = vi.fn();
        const xrGPUBinding = vi.fn();
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (globalThis as any).XRGPUBinding = xrGPUBinding;
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (sessionManager as any).session = {
            depthDataFormat: "unsigned-short",
            depthUsage: "cpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;

        const matrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        const normDepthBufferFromNormView = { matrix } as unknown as XRRigidTransform;
        const depthValues = new Uint16Array([100, 200, 300, 400]);
        const getDepthInMeters = vi.fn(function (this: XRCPUDepthInformation, x: number, y: number) {
            return this.rawValueToMeters * depthValues[y * 2 + x];
        });
        const depthInformation = {
            data: depthValues.buffer,
            getDepthInMeters,
            height: 2,
            normDepthBufferFromNormView,
            rawValueToMeters: 0.001,
            width: 2,
        } as unknown as XRCPUDepthInformation;
        const view = {} as XRView;
        const updateRawTextureSpy = vi.spyOn(engine, "updateRawTexture");
        const markMaterialsDirtySpy = vi.spyOn(scene, "markAllMaterialsAsDirty");
        let depthReader: ((x: number, y: number) => number) | undefined;

        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["ushort"],
            usagePreference: ["cpu"],
        });
        feature.onGetDepthInMetersAvailable.add((reader) => {
            depthReader = reader;
        });

        expect(feature.attach()).toBe(true);
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn(() => depthInformation),
            getViewerPose: vi.fn(() => ({ views: [view] })),
        } as unknown as XRFrame);

        expect(xrWebGLBinding).not.toHaveBeenCalled();
        expect(xrGPUBinding).not.toHaveBeenCalled();
        expect(feature.width).toBe(2);
        expect(feature.height).toBe(2);
        expect(feature.rawValueToMeters).toBe(0.001);
        expect(feature.normDepthBufferFromNormView).toBe(normDepthBufferFromNormView);
        expect(feature.latestDepthBuffer).toEqual(depthValues);
        expect(feature.latestDepthImageTexture?.getSize()).toEqual({ width: 2, height: 2 });
        expect(updateRawTextureSpy).toHaveBeenCalledTimes(1);
        expect(updateRawTextureSpy.mock.calls[0][1]).toEqual(Float32Array.from(depthValues));
        expect(markMaterialsDirtySpy).toHaveBeenCalledTimes(1);
        expect(depthReader?.(1, 1)).toBeCloseTo(0.4);
        expect(getDepthInMeters).toHaveBeenCalledExactlyOnceWith(1, 1);
    });

    it("disables once for WebGPU GPU depth without bindings, wrapping, or observers", () => {
        const xrWebGLBinding = vi.fn();
        const xrGPUBinding = vi.fn();
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (globalThis as any).XRGPUBinding = xrGPUBinding;
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (engine as any).wrapWebGLTexture = vi.fn();
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "gpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        const featuresManager = new WebXRFeaturesManager(sessionManager);
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        feature = featuresManager.enableFeature(WebXRDepthSensing.Name, 1, {
            dataFormatPreference: ["float"],
            usagePreference: ["gpu", "cpu"],
        });

        expect(feature.attached).toBe(false);
        expect(feature.disableAutoAttach).toBe(true);
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(WebGPUGPUDepthWarning);
        expect(xrWebGLBinding).not.toHaveBeenCalled();
        expect(xrGPUBinding).not.toHaveBeenCalled();
        expect((engine as any).wrapWebGLTexture).not.toHaveBeenCalled();
        expect(sessionManager.onXRFrameObservable.hasObservers()).toBe(false);
        expect(scene.onBeforeCameraRenderObservable.hasObservers()).toBe(false);
        expect(feature.latestDepthBuffer).toBeNull();
        expect(feature.latestDepthImageTexture).toBeNull();

        sessionManager.onXRSessionInit.notifyObservers(sessionManager.session);
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn(),
            getViewerPose: vi.fn(),
        } as unknown as XRFrame);
        expect(warnSpy).toHaveBeenCalledTimes(1);

        featuresManager.dispose();
        feature = undefined;
    });

    it("reuses the cached WebGL binding for WebGL GPU depth", () => {
        const nativeBinding = { getDepthInformation: vi.fn(() => null) };
        const xrWebGLBinding = vi.fn().mockImplementation(function () {
            return nativeBinding;
        });
        const glContext = {} as WebGLRenderingContext;
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (engine as any)._gl = glContext;
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "gpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;

        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float"],
            usagePreference: ["gpu"],
        });

        expect(feature.attach()).toBe(true);
        expect(xrWebGLBinding).toHaveBeenCalledExactlyOnceWith(sessionManager.session, glContext);
        expect(sessionManager._getGraphicsBinding().binding).toBe(nativeBinding);
        expect(xrWebGLBinding).toHaveBeenCalledTimes(1);
    });

    it("preserves caller depth usage and format preference order", async () => {
        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float", "ushort", "luminance-alpha"],
            usagePreference: ["gpu", "cpu"],
        });

        await expect(feature.getXRSessionInitExtension()).resolves.toEqual({
            depthSensing: {
                dataFormatPreference: ["float32", "unsigned-short", "luminance-alpha"],
                usagePreference: ["gpu-optimized", "cpu-optimized"],
            },
        });
    });
});
