// @vitest-environment jsdom

import { NullEngine } from "core/Engines/nullEngine";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Ray } from "core/Culling/ray.core";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import "core/Helpers/sceneHelpers";
import { WebXRLayers } from "core/XR/features/WebXRLayers";
import { WebXRDefaultExperience } from "core/XR/webXRDefaultExperience";
import { WebGPUXRSessionNotSupportedErrorMessage } from "core/XR/webXRGraphicsBinding";
import { WebXRState } from "core/XR/webXRTypes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("WebXRDefaultExperience", () => {
    let engine: NullEngine;
    let scene: Scene;
    let canvas: HTMLCanvasElement;
    const originalXr = (navigator as any).xr;
    const originalGPUBinding = (globalThis as any).XRGPUBinding;
    const originalGPUSubImage = (globalThis as any).XRGPUSubImage;

    beforeEach(() => {
        canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        engine = new NullEngine();
        vi.spyOn(engine, "getInputElement").mockReturnValue(canvas);
        scene = new Scene(engine);
        (navigator as any).xr = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            isSessionSupported: vi.fn().mockResolvedValue(true),
        };
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        canvas.remove();
        (navigator as any).xr = originalXr;
        (globalThis as any).XRGPUBinding = originalGPUBinding;
        (globalThis as any).XRGPUSubImage = originalGPUSubImage;
    });

    it("registers its default features and displays the entry UI when imported directly", async () => {
        const teleportationMaterial = new StandardMaterial("teleportationMaterial", scene);
        const experience = await WebXRDefaultExperience.CreateAsync(scene, {
            floorMeshes: [],
            inputOptions: {
                disableOnlineControllerRepository: true,
                doNotLoadControllerMeshes: true,
            },
            teleportationOptions: {
                useUtilityLayer: false,
                defaultTargetMeshOptions: {
                    teleportationCircleMaterial: teleportationMaterial,
                },
            },
        });

        expect(experience.baseExperience).toBeDefined();
        expect(experience.input).toBeDefined();
        expect(experience.pointerSelection).toBeDefined();
        expect(experience.teleportation).toBeDefined();
        expect(experience.nearInteraction).toBeDefined();
        expect(experience.enterExitUI.overlay.querySelector(".babylonVRicon")).not.toBeNull();
        expect(() => scene.pickWithRay(new Ray(Vector3.Zero(), Vector3.Forward()))).not.toThrow();
    });

    it("passes a rejected WebGPU XR session request to the default UI error callback", async () => {
        const onError = vi.fn();
        const experience = await scene.createDefaultXRExperienceAsync({
            disablePointerSelection: true,
            disableNearInteraction: true,
            disableHandTracking: true,
            uiOptions: { onError },
        });
        const button = experience.enterExitUI.overlay.querySelector<HTMLButtonElement>(".babylonVRicon");
        expect(button).not.toBeNull();

        const binding = vi.fn();
        binding.prototype.createProjectionLayer = vi.fn();
        binding.prototype.getViewSubImage = vi.fn();
        binding.prototype.getPreferredColorFormat = vi.fn();
        (globalThis as any).XRGPUBinding = binding;
        const subImage = vi.fn();
        subImage.prototype.getViewDescriptor = vi.fn();
        (globalThis as any).XRGPUSubImage = subImage;
        (engine as any)._isWebGPU = true;
        (engine as any)._options = { xrCompatible: true };
        experience.baseExperience.featuresManager.enableFeature(WebXRLayers.Name);

        const rejection = new DOMException("layers not granted", "NotSupportedError");
        const requestSession = vi.fn().mockRejectedValue(rejection);
        (navigator as any).xr.requestSession = requestSession;

        button!.click();
        await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());

        const error = onError.mock.calls[0][0];
        expect(error).toBeInstanceOf(Error);
        expect(error).toMatchObject({ message: WebGPUXRSessionNotSupportedErrorMessage, cause: rejection });
        expect(requestSession).toHaveBeenCalledWith("immersive-vr", expect.objectContaining({ requiredFeatures: expect.arrayContaining(["layers", "webgpu"]) }));
        expect(experience.baseExperience.state).toBe(WebXRState.NOT_IN_XR);
        expect(experience.baseExperience.sessionManager.inXRSession).toBe(false);
        expect(button!.classList.contains("xr-error")).toBe(true);
    });
});
