/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { UniversalCamera } from "core/Cameras/universalCamera";
import { Vector3 } from "core/Maths/math.vector";
import { WebXRExperienceHelper } from "core/XR/webXRExperienceHelper";
import { WebXRState } from "core/XR/webXRTypes";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

describe("WebXRExperienceHelper", () => {
    let engine: NullEngine;
    let scene: Scene;
    let helper: WebXRExperienceHelper;
    const originalXr = (navigator as any).xr;

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
    });

    afterEach(() => {
        helper.dispose();
        scene.dispose();
        engine.dispose();
        (navigator as any).xr = originalXr;
    });

    // Reproduces the hardware-observed WebGPU Phase 1 flow: the WebGPU XR session enters but,
    // with no layer attached (the XRProjectionLayer is a later phase), no XR frame ever arrives,
    // so onXRFrameObservable never fires and the state stays at ENTERING_XR (never IN_XR).
    describe("WebGPU Phase 1 enter/exit (no-frame stall)", () => {
        beforeEach(() => {
            (engine as any)._isWebGPU = true;
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

        it("exitXRAsync from ENTERING_XR is a clean no-op (no hang, no leak)", async () => {
            await helper.enterXRAsync("immersive-vr", "local-floor", {} as any);
            const smExit = vi.spyOn(helper.sessionManager, "exitXRAsync");

            await expect(helper.exitXRAsync()).resolves.toBeUndefined();

            // Guarded by state !== IN_XR: it must not touch the session manager and must not change state.
            expect(smExit).not.toHaveBeenCalled();
            expect(helper.state).toBe(WebXRState.ENTERING_XR);
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
