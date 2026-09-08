// @vitest-environment jsdom

import { NullEngine } from "core/Engines/nullEngine";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Ray } from "core/Culling/ray.core";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { WebXRDefaultExperience } from "core/XR/webXRDefaultExperience";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("WebXRDefaultExperience", () => {
    let engine: NullEngine;
    let scene: Scene;
    let canvas: HTMLCanvasElement;
    const originalXr = (navigator as any).xr;

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
});
