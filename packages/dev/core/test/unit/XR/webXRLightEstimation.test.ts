/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { WebGLHardwareTexture } from "core/Engines/WebGL/webGLHardwareTexture";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { WebXRLightEstimation } from "core/XR/features/WebXRLightEstimation";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const WebGPUReflectionWarning =
    "WebXR Light Estimation reflection cube maps are unavailable with WebGPU XR because they are exposed only by XRWebGLBinding; light direction, intensity, and spherical harmonics remain enabled.";

type ReflectionListener = ((event: Event) => void) | { handleEvent(event: Event): void };

function createLightProbe() {
    const reflectionListeners = new Set<ReflectionListener>();
    const lightProbe = {
        addEventListener: vi.fn((type: string, listener: ReflectionListener) => {
            if (type === "reflectionchange") {
                reflectionListeners.add(listener);
            }
        }),
        removeEventListener: vi.fn((type: string, listener: ReflectionListener) => {
            if (type === "reflectionchange") {
                reflectionListeners.delete(listener);
            }
        }),
    } as unknown as XRLightProbe;

    return {
        lightProbe,
        dispatchReflectionChange: () => {
            for (const listener of reflectionListeners) {
                if (typeof listener === "function") {
                    listener(new Event("reflectionchange"));
                } else {
                    listener.handleEvent(new Event("reflectionchange"));
                }
            }
        },
    };
}

function createLightEstimate(direction: [number, number, number], intensity: [number, number, number], sphericalHarmonicsStart: number): XRLightEstimate {
    return {
        primaryLightDirection: { x: direction[0], y: direction[1], z: direction[2] } as DOMPointReadOnly,
        primaryLightIntensity: { x: intensity[0], y: intensity[1], z: intensity[2] } as DOMPointReadOnly,
        sphericalHarmonicsCoefficients: Float32Array.from({ length: 27 }, (_, index) => sphericalHarmonicsStart + index),
    };
}

describe("WebXRLightEstimation", () => {
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
        vi.useRealTimers();
        vi.restoreAllMocks();
        (globalThis as any).XRWebGLBinding = originalWebGLBinding;
        (globalThis as any).XRGPUBinding = originalGPUBinding;
        scene.dispose();
        engine.dispose();
    });

    it("keeps changing frame estimates active while disabling requested reflection on WebGPU", async () => {
        const { lightProbe } = createLightProbe();
        const requestLightProbe = vi.fn(async () => lightProbe);
        const xrWebGLBinding = vi.fn();
        const xrGPUBinding = vi.fn();
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (globalThis as any).XRGPUBinding = xrGPUBinding;
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (sessionManager as any).session = {
            enabledFeatures: ["light-estimation"],
            preferredReflectionFormat: "rgba16f",
            requestLightProbe,
        } as unknown as XRSession;
        const getGraphicsBindingSpy = vi.spyOn(sessionManager, "_getGraphicsBinding");
        const webGLTextureSetSpy = vi.spyOn(WebGLHardwareTexture.prototype, "set");
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const feature = new WebXRLightEstimation(sessionManager, {});

        expect(feature.attach()).toBe(true);
        await Promise.resolve();

        expect(requestLightProbe).toHaveBeenCalledExactlyOnceWith({ reflectionFormat: "rgba16f" });
        expect(lightProbe.addEventListener).not.toHaveBeenCalled();
        expect(warnSpy.mock.calls.filter(([warning]) => warning === WebGPUReflectionWarning)).toHaveLength(1);

        const firstEstimate = createLightEstimate([1, 2, 3], [2, 4, 1], 10);
        const secondEstimate = createLightEstimate([-2, 1, -4], [6, 3, 1.5], 20);
        const getLightEstimate = vi.fn().mockReturnValueOnce(firstEstimate).mockReturnValueOnce(secondEstimate);
        const xrFrame = { getLightEstimate } as unknown as XRFrame;

        sessionManager.onXRFrameObservable.notifyObservers(xrFrame);
        const firstResult = feature.xrLightingEstimate!;
        expect(firstResult.lightDirection.asArray()).toEqual([-1, -2, 3]);
        expect(firstResult.lightIntensity).toBe(4);
        expect(firstResult.lightColor.asArray()).toEqual([0.5, 1, 0.25]);
        expect(firstResult.sphericalHarmonics.l00.asArray()).toEqual([10, 11, 12]);

        sessionManager.onXRFrameObservable.notifyObservers(xrFrame);
        const secondResult = feature.xrLightingEstimate!;
        expect(secondResult.lightDirection.asArray()).toEqual([2, -1, -4]);
        expect(secondResult.lightIntensity).toBe(6);
        expect(secondResult.lightColor.asArray()).toEqual([1, 0.5, 0.25]);
        expect(secondResult.sphericalHarmonics.l00.asArray()).toEqual([20, 21, 22]);
        expect(getLightEstimate).toHaveBeenCalledTimes(2);
        expect(getLightEstimate).toHaveBeenNthCalledWith(1, lightProbe);
        expect(getLightEstimate).toHaveBeenNthCalledWith(2, lightProbe);
        expect(feature.reflectionCubeMapTexture).toBeNull();
        expect(getGraphicsBindingSpy).not.toHaveBeenCalled();
        expect(webGLTextureSetSpy).not.toHaveBeenCalled();
        expect(xrGPUBinding).not.toHaveBeenCalled();
        expect(xrWebGLBinding).not.toHaveBeenCalled();
        expect(warnSpy.mock.calls.filter(([warning]) => warning === WebGPUReflectionWarning)).toHaveLength(1);

        expect(feature.detach()).toBe(true);
        expect(feature.attach()).toBe(true);
        await Promise.resolve();
        expect(requestLightProbe).toHaveBeenCalledTimes(2);
        expect(warnSpy.mock.calls.filter(([warning]) => warning === WebGPUReflectionWarning)).toHaveLength(1);

        feature.dispose();
    });

    it("does not emit the WebGPU reflection warning when reflection was disabled by the caller", async () => {
        const { lightProbe } = createLightProbe();
        const requestLightProbe = vi.fn(async () => lightProbe);
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (sessionManager as any).session = {
            enabledFeatures: ["light-estimation"],
            requestLightProbe,
        } as unknown as XRSession;
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const feature = new WebXRLightEstimation(sessionManager, { disableCubeMapReflection: true });

        expect(feature.attach()).toBe(true);
        await Promise.resolve();

        expect(requestLightProbe).toHaveBeenCalledExactlyOnceWith({ reflectionFormat: "srgba8" });
        expect(lightProbe.addEventListener).not.toHaveBeenCalled();
        expect(warnSpy.mock.calls.filter(([warning]) => warning === WebGPUReflectionWarning)).toHaveLength(0);

        const getLightEstimate = vi.fn(() => createLightEstimate([0, 1, 0], [1, 2, 1], 30));
        sessionManager.onXRFrameObservable.notifyObservers({ getLightEstimate } as unknown as XRFrame);

        expect(feature.xrLightingEstimate?.lightIntensity).toBe(2);
        expect(feature.xrLightingEstimate?.sphericalHarmonics.l00.asArray()).toEqual([30, 31, 32]);
        expect(feature.reflectionCubeMapTexture).toBeNull();

        feature.dispose();
    });

    it("preserves WebGL reflection options, polling, lifecycle, wrapping, and cached binding reuse", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(1_000);
        const { lightProbe, dispatchReflectionChange } = createLightProbe();
        const requestLightProbe = vi.fn(async () => lightProbe);
        const firstWebGLTexture = {} as WebGLTexture;
        const secondWebGLTexture = {} as WebGLTexture;
        const getReflectionCubeMap = vi.fn().mockReturnValueOnce(firstWebGLTexture).mockReturnValueOnce(secondWebGLTexture);
        const nativeBinding = { getReflectionCubeMap };
        const xrWebGLBinding = vi.fn().mockImplementation(function () {
            return nativeBinding;
        });
        const glContext = {
            deleteRenderbuffer: vi.fn(),
            deleteTexture: vi.fn(),
        } as unknown as WebGLRenderingContext;
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (engine as any)._gl = glContext;
        (sessionManager as any).session = {
            enabledFeatures: ["light-estimation"],
            preferredReflectionFormat: "rgba16f",
            requestLightProbe,
        } as unknown as XRSession;
        const resetTextureCacheSpy = vi.spyOn(engine, "resetTextureCache");
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const feature = new WebXRLightEstimation(sessionManager, {
            cubeMapPollInterval: 1_000,
            disablePreFiltering: true,
            reflectionFormat: "srgba8",
            setSceneEnvironmentTexture: true,
        });

        expect(feature.attach()).toBe(true);
        await Promise.resolve();

        expect(requestLightProbe).toHaveBeenCalledExactlyOnceWith({ reflectionFormat: "srgba8" });
        expect(warnSpy.mock.calls.filter(([warning]) => warning === WebGPUReflectionWarning)).toHaveLength(0);
        expect(lightProbe.addEventListener).toHaveBeenCalledExactlyOnceWith("reflectionchange", expect.any(Function));
        expect(scene.environmentTexture).toBe(feature.reflectionCubeMapTexture);

        dispatchReflectionChange();
        vi.advanceTimersByTime(999);
        dispatchReflectionChange();
        expect(getReflectionCubeMap).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        dispatchReflectionChange();
        expect(getReflectionCubeMap).toHaveBeenCalledExactlyOnceWith(lightProbe);
        expect(xrWebGLBinding).toHaveBeenCalledExactlyOnceWith(sessionManager.session, glContext);
        expect(sessionManager._getGraphicsBinding().binding).toBe(nativeBinding);
        expect(xrWebGLBinding).toHaveBeenCalledTimes(1);
        expect(feature.reflectionCubeMapTexture?._texture?._hardwareTexture?.underlyingResource).toBe(firstWebGLTexture);
        expect(feature.reflectionCubeMapTexture?._texture?._useSRGBBuffer).toBe(true);

        vi.advanceTimersByTime(1_000);
        dispatchReflectionChange();
        expect(getReflectionCubeMap).toHaveBeenCalledTimes(2);
        expect(feature.reflectionCubeMapTexture?._texture?._hardwareTexture?.underlyingResource).toBe(secondWebGLTexture);
        expect(resetTextureCacheSpy).toHaveBeenCalledTimes(1);
        expect(xrWebGLBinding).toHaveBeenCalledTimes(1);

        expect(feature.detach()).toBe(true);
        expect(lightProbe.removeEventListener).toHaveBeenCalledExactlyOnceWith("reflectionchange", expect.any(Function));

        feature.dispose();
        expect(feature.reflectionCubeMapTexture).toBeNull();
    });
});
