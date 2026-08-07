/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { WebXRRawCameraAccess } from "core/XR/features/WebXRRawCameraAccess";
import { WebXRFeaturesManager } from "core/XR/webXRFeaturesManager";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const WebGPUWarning = "WebXR Raw Camera Access is unavailable with WebGPU XR because camera images are exposed only by XRWebGLBinding; the feature was disabled.";

describe("WebXRRawCameraAccess", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let originalWebGLBinding: unknown;
    let originalGPUBinding: unknown;

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
        originalWebGLBinding = (globalThis as any).XRWebGLBinding;
        originalGPUBinding = (globalThis as any).XRGPUBinding;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        (globalThis as any).XRWebGLBinding = originalWebGLBinding;
        (globalThis as any).XRGPUBinding = originalGPUBinding;
        scene.dispose();
        engine.dispose();
    });

    it("reuses the cached WebGL binding and updates camera textures", () => {
        const cameraTexture = {};
        const getCameraImage = vi.fn(() => cameraTexture);
        const nativeBinding = { getCameraImage };
        const xrWebGLBinding = vi.fn().mockImplementation(function () {
            return nativeBinding;
        });
        const glContext = {
            deleteTexture: vi.fn(),
        } as unknown as WebGLRenderingContext;
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (engine as any)._gl = glContext;
        (sessionManager as any).session = {
            enabledFeatures: ["camera-access"],
        } as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
        const feature = new WebXRRawCameraAccess(sessionManager);

        expect(feature.attach()).toBe(true);
        expect(xrWebGLBinding).toHaveBeenCalledExactlyOnceWith(sessionManager.session, glContext);
        expect(sessionManager._getGraphicsBinding().binding).toBe(nativeBinding);

        const projectionMatrix = new Float32Array(16);
        projectionMatrix[0] = 2;
        projectionMatrix[5] = 2;
        const camera = { width: 640, height: 480 } as XRCamera;
        const view = {
            camera,
            eye: "none",
            projectionMatrix,
        } as XRView;
        sessionManager.onXRFrameObservable.notifyObservers({
            getViewerPose: vi.fn(() => ({ views: [view] })),
        } as unknown as XRFrame);

        expect(getCameraImage).toHaveBeenCalledExactlyOnceWith(camera);
        expect(xrWebGLBinding).toHaveBeenCalledTimes(1);
        expect(feature.texturesData).toHaveLength(1);
        expect(feature.viewIndex).toEqual(["none"]);
        expect(feature.cameraIntrinsics[0]).toMatchObject({
            width: 640,
            height: 480,
            u0: 320,
            v0: 240,
            ax: 640,
            ay: 480,
        });
    });

    it("disables once on WebGPU without WebGL binding, camera calls, observers, or textures", () => {
        const getCameraImage = vi.fn();
        const xrWebGLBinding = vi.fn().mockImplementation(function () {
            return { getCameraImage };
        });
        const xrGPUBinding = vi.fn().mockImplementation(function () {
            return {};
        });
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (globalThis as any).XRGPUBinding = xrGPUBinding;
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (sessionManager as any).session = {} as XRSession;
        const featuresManager = new WebXRFeaturesManager(sessionManager);
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        const feature = featuresManager.enableFeature(WebXRRawCameraAccess.Name, 1);

        expect(feature.attached).toBe(false);
        expect(feature.disableAutoAttach).toBe(true);
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(WebGPUWarning);
        expect(xrGPUBinding).not.toHaveBeenCalled();
        expect(xrWebGLBinding).not.toHaveBeenCalled();
        expect(getCameraImage).not.toHaveBeenCalled();
        expect(sessionManager.onXRFrameObservable.hasObservers()).toBe(false);
        expect(feature.texturesData).toHaveLength(0);
        expect(feature.cameraIntrinsics).toHaveLength(0);

        sessionManager.onXRSessionInit.notifyObservers(sessionManager.session);
        expect(warnSpy).toHaveBeenCalledTimes(1);

        const getViewerPose = vi.fn();
        sessionManager.onXRFrameObservable.notifyObservers({ getViewerPose } as unknown as XRFrame);
        expect(getViewerPose).not.toHaveBeenCalled();
        expect(feature.texturesData).toHaveLength(0);
        expect(warnSpy).toHaveBeenCalledTimes(1);

        featuresManager.dispose();
    });
});
