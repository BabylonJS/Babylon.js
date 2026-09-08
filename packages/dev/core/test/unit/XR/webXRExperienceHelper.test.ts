/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { UniversalCamera } from "core/Cameras/universalCamera";
import { Vector3 } from "core/Maths/math.vector";
import { WebXRExperienceHelper } from "core/XR/webXRExperienceHelper";
import { WebGPUXREngineNotCompatibleErrorMessage, WebGPUXRNotSupportedErrorMessage } from "core/XR/webXRGraphicsBinding";
import { WebXRState } from "core/XR/webXRTypes";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

describe("WebXRExperienceHelper", () => {
    let engine: NullEngine;
    let scene: Scene;
    let helper: WebXRExperienceHelper;
    const originalXr = (navigator as any).xr;
    const originalGPUBinding = (globalThis as any).XRGPUBinding;
    const originalGPUSubImage = (globalThis as any).XRGPUSubImage;

    beforeEach(async () => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        // A non-VR active camera is restored on exit; give the scene one.
        scene.activeCamera = new UniversalCamera("nonVR", Vector3.Zero(), scene);
        // initializeAsync only needs navigator.xr to exist.
        (navigator as any).xr = {};
        helper = await WebXRExperienceHelper.CreateAsync(scene);
        const binding = vi.fn();
        binding.prototype.createProjectionLayer = vi.fn();
        binding.prototype.getViewSubImage = vi.fn();
        binding.prototype.getPreferredColorFormat = vi.fn();
        (globalThis as any).XRGPUBinding = binding;
        const subImage = vi.fn();
        subImage.prototype.getViewDescriptor = vi.fn();
        (globalThis as any).XRGPUSubImage = subImage;
    });

    afterEach(() => {
        helper.dispose();
        scene.dispose();
        engine.dispose();
        (navigator as any).xr = originalXr;
        (globalThis as any).XRGPUBinding = originalGPUBinding;
        (globalThis as any).XRGPUSubImage = originalGPUSubImage;
    });

    describe("WebGPU preflight", () => {
        beforeEach(() => {
            (engine as any)._isWebGPU = true;
            (engine as any)._options = { xrCompatible: true };
        });

        it("rejects an engine created without XR compatibility before changing state or initializing a session", async () => {
            (engine as any)._options.xrCompatible = false;
            const initializeSession = vi.spyOn(helper.sessionManager, "initializeSessionAsync");

            await expect(helper.enterXRAsync("immersive-vr", "local-floor")).rejects.toThrow(WebGPUXREngineNotCompatibleErrorMessage);

            expect(helper.state).toBe(WebXRState.NOT_IN_XR);
            expect(initializeSession).not.toHaveBeenCalled();
        });

        it("rejects missing binding support before changing state or initializing a session", async () => {
            delete (globalThis as any).XRGPUBinding;
            const initializeSession = vi.spyOn(helper.sessionManager, "initializeSessionAsync");

            await expect(helper.enterXRAsync("immersive-vr", "local-floor")).rejects.toThrow(WebGPUXRNotSupportedErrorMessage);

            expect(helper.state).toBe(WebXRState.NOT_IN_XR);
            expect(initializeSession).not.toHaveBeenCalled();
        });

        it("rejects a missing Layers feature before changing state or initializing a session", async () => {
            const initializeSession = vi.spyOn(helper.sessionManager, "initializeSessionAsync");

            await expect(helper.enterXRAsync("immersive-vr", "local-floor")).rejects.toThrow(
                "WebGPU XR requires the WebXR Layers feature. Import and enable WebXRLayers before calling enterXRAsync."
            );

            expect(helper.state).toBe(WebXRState.NOT_IN_XR);
            expect(initializeSession).not.toHaveBeenCalled();
        });

        it("ends the session and restores state when the required Layers feature fails to attach", async () => {
            vi.spyOn(helper.featuresManager, "getEnabledFeature").mockReturnValue({ attached: false } as any);
            const end = vi.fn().mockResolvedValue(undefined);
            const requestSession = vi.fn().mockResolvedValue({
                addEventListener: vi.fn(),
                end,
            });
            (helper.sessionManager as any)._xrNavigator = { xr: { requestSession } };

            await expect(helper.enterXRAsync("immersive-vr", "local-floor")).rejects.toThrow("WebGPU XR could not attach the required WebXR Layers feature.");

            expect(end).toHaveBeenCalledTimes(1);
            expect(helper.sessionManager.inXRSession).toBe(false);
            expect((helper.sessionManager as any)._graphicsBinding).toBeNull();
            expect(helper.state).toBe(WebXRState.NOT_IN_XR);
        });

        it("ends the session when the projection-layer render state update throws", async () => {
            const renderStateError = new Error("projection layer rejected");
            vi.spyOn(helper.featuresManager, "getEnabledFeature").mockReturnValue({ attached: true } as any);
            const end = vi.fn().mockResolvedValue(undefined);
            const updateRenderState = vi.fn().mockImplementation(() => {
                throw renderStateError;
            });
            const requestSession = vi.fn().mockResolvedValue({
                addEventListener: vi.fn(),
                end,
                renderState: {},
                updateRenderState,
            });
            (helper.sessionManager as any)._xrNavigator = { xr: { requestSession } };
            helper.sessionManager.onXRSessionInit.add(() => {
                helper.sessionManager.updateRenderState({ layers: [] });
            });

            await expect(helper.enterXRAsync("immersive-vr", "local-floor")).rejects.toBe(renderStateError);

            expect(updateRenderState).toHaveBeenCalledTimes(1);
            expect(end).toHaveBeenCalledTimes(1);
            expect(helper.sessionManager.inXRSession).toBe(false);
            expect(helper.state).toBe(WebXRState.NOT_IN_XR);
        });
    });

    describe("WebGPU configured entry without a frame", () => {
        beforeEach(() => {
            (engine as any)._isWebGPU = true;
            (engine as any)._options = { xrCompatible: true };
            vi.spyOn(helper.featuresManager, "getEnabledFeature").mockReturnValue({ attached: true } as any);
            // Stub the heavy session-manager collaborators so enterXRAsync's real state machine
            // runs without live WebXR globals. runXRRenderLoop is a no-op, so no frame is produced.
            vi.spyOn(helper.sessionManager, "initializeSessionAsync").mockImplementation(async () => {
                (helper.sessionManager as any).session = {};
                helper.sessionManager.inXRSession = true;
                return (helper.sessionManager as any).session;
            });
            vi.spyOn(helper.sessionManager, "setReferenceSpaceTypeAsync").mockResolvedValue({} as XRReferenceSpace);
            vi.spyOn(helper.sessionManager, "updateRenderState").mockImplementation(() => {});
            vi.spyOn(helper.sessionManager, "runXRRenderLoop").mockImplementation(() => {});
            // Camera transform is irrelevant to the state machine under test.
            vi.spyOn(helper as any, "_nonXRToXRCamera").mockImplementation(() => {});
        });

        it("stays at ENTERING_XR when no frame arrives", async () => {
            await helper.enterXRAsync("immersive-vr", "local-floor", {} as any);
            expect(helper.state).toBe(WebXRState.ENTERING_XR);
        });

        it("promotes Layers from optional to required without mutating the caller's session init", async () => {
            const sessionInit: XRSessionInit = { optionalFeatures: ["layers", "anchors"] };

            await helper.enterXRAsync("immersive-vr", "local-floor", {} as any, sessionInit);

            expect(helper.sessionManager.initializeSessionAsync).toHaveBeenCalledWith("immersive-vr", {
                optionalFeatures: ["anchors", "local-floor"],
                requiredFeatures: ["layers"],
            });
            expect(sessionInit).toEqual({ optionalFeatures: ["layers", "anchors"] });
        });

        it("exitXRAsync ends a negotiated session that has not produced a frame", async () => {
            await helper.enterXRAsync("immersive-vr", "local-floor", {} as any);
            const smExit = vi.spyOn(helper.sessionManager, "exitXRAsync").mockImplementation(async () => {
                helper.sessionManager.inXRSession = false;
            });

            await expect(helper.exitXRAsync()).resolves.toBeUndefined();

            expect(smExit).toHaveBeenCalledTimes(1);
            expect(helper.sessionManager.inXRSession).toBe(false);
            expect(helper.state).toBe(WebXRState.EXITING_XR);
        });

        it("restores the scene when camera initialization throws after the session starts", async () => {
            const originalCamera = scene.activeCamera;
            const cameraError = new Error("camera initialization failed");
            vi.spyOn(helper as any, "_nonXRToXRCamera").mockImplementationOnce(() => {
                throw cameraError;
            });
            vi.spyOn(helper.sessionManager, "exitXRAsync").mockImplementation(async () => {
                helper.sessionManager.inXRSession = false;
                helper.sessionManager.onXRSessionEnded.notifyObservers(null);
            });

            await expect(helper.enterXRAsync("immersive-vr", "local-floor", {} as any)).rejects.toBe(cameraError);

            expect(scene.activeCamera).toBe(originalCamera);
            expect(helper.state).toBe(WebXRState.NOT_IN_XR);
        });

        it("restores the scene before a previously registered end observer throws", async () => {
            const originalCamera = scene.activeCamera;
            const observerError = new Error("end observer failed");
            helper.sessionManager.onXRSessionEnded.add(() => {
                throw observerError;
            });
            await helper.enterXRAsync("immersive-vr", "local-floor", {} as any);

            expect(() => helper.sessionManager.onXRSessionEnded.notifyObservers(null)).toThrow(observerError);
            expect(scene.activeCamera).toBe(originalCamera);
            expect(helper.state).toBe(WebXRState.NOT_IN_XR);
        });

        it("returns to NOT_IN_XR when the session ends from ENTERING_XR", async () => {
            await helper.enterXRAsync("immersive-vr", "local-floor", {} as any);
            expect(helper.state).toBe(WebXRState.ENTERING_XR);

            // Simulate the native "end" (what the session manager's end listener notifies).
            expect(() => helper.sessionManager.onXRSessionEnded.notifyObservers(null)).not.toThrow();

            expect(helper.state).toBe(WebXRState.NOT_IN_XR);
        });
    });
});
