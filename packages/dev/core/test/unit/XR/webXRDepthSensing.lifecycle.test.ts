/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { WebXRDepthSensing } from "core/XR/features/WebXRDepthSensing";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface IDepthLifecycleSession {
    depthActive?: boolean;
    pauseDepthSensing?: () => Promise<void>;
    resumeDepthSensing?: () => Promise<void>;
}

describe("WebXRDepthSensing lifecycle controls", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let feature: WebXRDepthSensing;
    const originalXRDescriptor = Object.getOwnPropertyDescriptor(navigator, "xr");

    const setActiveSession = (members: IDepthLifecycleSession = {}) => {
        const session = {
            depthDataFormat: "float32",
            depthUsage: "cpu-optimized",
            enabledFeatures: ["depth-sensing"],
            ...members,
        } as XRSession & IDepthLifecycleSession;
        sessionManager.session = session;
        sessionManager.inXRSession = true;
        return session;
    };

    beforeEach(async () => {
        Object.defineProperty(navigator, "xr", {
            configurable: true,
            value: { native: false },
        });
        engine = new NullEngine();
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
        await sessionManager.initializeAsync();
        vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float"],
            usagePreference: ["cpu"],
        });
    });

    afterEach(() => {
        sessionManager.inXRSession = false;
        feature.dispose();
        sessionManager.dispose();
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
        if (originalXRDescriptor) {
            Object.defineProperty(navigator, "xr", originalXRDescriptor);
        } else {
            Reflect.deleteProperty(navigator, "xr");
        }
    });

    it("reports the native active state without caching it", () => {
        expect(feature.isDepthSensingActive).toBe(false);
        const session = setActiveSession({ depthActive: true });

        expect(feature.isDepthSensingActive).toBe(true);

        session.depthActive = false;
        expect(feature.isDepthSensingActive).toBe(false);

        delete session.depthActive;
        expect(feature.isDepthSensingActive).toBe(false);
    });

    it("delegates pause and follows native promise settlement", async () => {
        let resolveNativePromise = () => {};
        const nativePromise = new Promise<void>((resolve) => {
            resolveNativePromise = resolve;
        });
        const pauseDepthSensing = vi.fn(() => nativePromise);
        const session = setActiveSession({ pauseDepthSensing });
        let settled = false;

        const result = feature.pauseDepthSensingAsync();
        void result.then(() => {
            settled = true;
        });

        expect(pauseDepthSensing).toHaveBeenCalledExactlyOnceWith();
        expect(pauseDepthSensing.mock.instances[0]).toBe(session);
        await Promise.resolve();
        expect(settled).toBe(false);

        resolveNativePromise();
        await result;
        expect(settled).toBe(true);
    });

    it("delegates resume and follows native promise settlement", async () => {
        let resolveNativePromise = () => {};
        const nativePromise = new Promise<void>((resolve) => {
            resolveNativePromise = resolve;
        });
        const resumeDepthSensing = vi.fn(() => nativePromise);
        const session = setActiveSession({ resumeDepthSensing });
        let settled = false;

        const result = feature.resumeDepthSensingAsync();
        void result.then(() => {
            settled = true;
        });

        expect(resumeDepthSensing).toHaveBeenCalledExactlyOnceWith();
        expect(resumeDepthSensing.mock.instances[0]).toBe(session);
        await Promise.resolve();
        expect(settled).toBe(false);

        resolveNativePromise();
        await result;
        expect(settled).toBe(true);
    });

    it("propagates native pause and resume rejections", async () => {
        const pauseError = new Error("Pause failed");
        const resumeError = new Error("Resume failed");
        setActiveSession({
            pauseDepthSensing: () => Promise.reject(pauseError),
            resumeDepthSensing: () => Promise.reject(resumeError),
        });

        await expect(feature.pauseDepthSensingAsync()).rejects.toBe(pauseError);
        await expect(feature.resumeDepthSensingAsync()).rejects.toBe(resumeError);
    });

    it("detects pause and resume support independently", async () => {
        const resumeDepthSensing = vi.fn(() => Promise.resolve());
        setActiveSession({ resumeDepthSensing });

        await expect(feature.pauseDepthSensingAsync()).rejects.toThrow("XRSession.pauseDepthSensing is not supported by this XR runtime.");
        await expect(feature.resumeDepthSensingAsync()).resolves.toBeUndefined();
        expect(resumeDepthSensing).toHaveBeenCalledExactlyOnceWith();

        const pauseDepthSensing = vi.fn(() => Promise.resolve());
        setActiveSession({ pauseDepthSensing });

        await expect(feature.pauseDepthSensingAsync()).resolves.toBeUndefined();
        await expect(feature.resumeDepthSensingAsync()).rejects.toThrow("XRSession.resumeDepthSensing is not supported by this XR runtime.");
        expect(pauseDepthSensing).toHaveBeenCalledExactlyOnceWith();
    });

    it("rejects lifecycle operations without an active XR session", async () => {
        await expect(feature.pauseDepthSensingAsync()).rejects.toThrow("Pausing WebXR depth sensing requires an active XR session.");
        await expect(feature.resumeDepthSensingAsync()).rejects.toThrow("Resuming WebXR depth sensing requires an active XR session.");

        setActiveSession({
            pauseDepthSensing: () => Promise.resolve(),
            resumeDepthSensing: () => Promise.resolve(),
        });
        sessionManager.inXRSession = false;

        await expect(feature.pauseDepthSensingAsync()).rejects.toThrow("Pausing WebXR depth sensing requires an active XR session.");
        await expect(feature.resumeDepthSensingAsync()).rejects.toThrow("Resuming WebXR depth sensing requires an active XR session.");
    });

    it("preserves existing attach and detach behavior", async () => {
        Object.defineProperty(engine, "isWebGPU", { configurable: true, value: true });
        const pauseDepthSensing = vi.fn(() => Promise.resolve());
        const resumeDepthSensing = vi.fn(() => Promise.resolve());
        setActiveSession({ depthActive: true, pauseDepthSensing, resumeDepthSensing });

        expect(feature.attach()).toBe(true);
        expect(feature.attached).toBe(true);
        await feature.pauseDepthSensingAsync();
        expect(feature.detach()).toBe(true);
        expect(feature.attached).toBe(false);
        await feature.resumeDepthSensingAsync();

        expect(pauseDepthSensing).toHaveBeenCalledExactlyOnceWith();
        expect(resumeDepthSensing).toHaveBeenCalledExactlyOnceWith();
    });
});
