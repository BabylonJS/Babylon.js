import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CameraMovement } from "core/Cameras/cameraMovement";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

describe("CameraMovement", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let movement: CameraMovement;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        movement = new CameraMovement(scene, Vector3.Zero());
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    describe("resolveInteraction", () => {
        it("should match by source type", () => {
            movement.inputMap = [
                { source: "pointer", button: 0, interaction: "rotate" },
                { source: "keyboard", interaction: "translate" },
                { source: "wheel", interaction: "zoom" },
                { source: "touch", interaction: "pan" },
            ];

            expect(movement.resolveInteraction("pointer", { button: 0 })).toBe("rotate");
            expect(movement.resolveInteraction("keyboard")).toBe("translate");
            expect(movement.resolveInteraction("wheel")).toBe("zoom");
            expect(movement.resolveInteraction("touch")).toBe("pan");
        });

        it("should return first match when multiple entries exist for same source", () => {
            movement.inputMap = [
                { source: "pointer", button: 0, interaction: "rotate" },
                { source: "pointer", button: 0, interaction: "pan" },
            ];

            expect(movement.resolveInteraction("pointer", { button: 0 })).toBe("rotate");
        });

        it("should match exact modifiers", () => {
            movement.inputMap = [{ source: "keyboard", modifiers: { ctrl: true }, interaction: "pan" }];

            expect(movement.resolveInteraction("keyboard", { modifiers: { ctrl: true } })).toBe("pan");
            expect(movement.resolveInteraction("keyboard", { modifiers: { ctrl: false } })).toBe("none");
        });

        it("should match when entry has no modifiers (matches anything)", () => {
            movement.inputMap = [{ source: "keyboard", interaction: "rotate" }];

            expect(movement.resolveInteraction("keyboard", { modifiers: { ctrl: true } })).toBe("rotate");
            expect(movement.resolveInteraction("keyboard")).toBe("rotate");
        });

        it("should match partial modifiers (only check specified keys)", () => {
            movement.inputMap = [{ source: "keyboard", modifiers: { ctrl: true }, interaction: "pan" }];

            expect(movement.resolveInteraction("keyboard", { modifiers: { ctrl: true, shift: true } })).toBe("pan");
        });

        it("should match pointer button", () => {
            movement.inputMap = [{ source: "pointer", button: 2, interaction: "pan" }];

            expect(movement.resolveInteraction("pointer", { button: 2 })).toBe("pan");
            expect(movement.resolveInteraction("pointer", { button: 0 })).toBe("none");
        });

        it("should match touch count", () => {
            movement.inputMap = [{ source: "touch", touchCount: 2, interaction: "zoom" }];

            expect(movement.resolveInteraction("touch", { touchCount: 2 })).toBe("zoom");
            expect(movement.resolveInteraction("touch", { touchCount: 1 })).toBe("none");
        });

        it("should return 'none' when no entry matches", () => {
            movement.inputMap = [{ source: "pointer", button: 0, interaction: "rotate" }];

            expect(movement.resolveInteraction("keyboard")).toBe("none");
        });

        it("should return 'none' with empty inputMap", () => {
            movement.inputMap = [];
            expect(movement.resolveInteraction("pointer", { button: 0 })).toBe("none");
        });
    });

    describe("computeCurrentFrameDeltas", () => {
        it("should reset accumulators after computation", () => {
            movement.panAccumulatedPixels.x = 10;
            movement.rotationAccumulatedPixels.y = 5;
            movement.zoomAccumulatedPixels = 3;
            movement.activeInput = true;

            movement.computeCurrentFrameDeltas();

            expect(movement.panAccumulatedPixels.x).toBe(0);
            expect(movement.rotationAccumulatedPixels.y).toBe(0);
            expect(movement.zoomAccumulatedPixels).toBe(0);
        });

        it("should apply panSpeed multiplier", () => {
            movement.panSpeed = 2;
            movement.panAccumulatedPixels.x = 10;
            movement.activeInput = true;

            movement.computeCurrentFrameDeltas();
            const firstDelta = movement.panDeltaCurrentFrame.x;

            movement.panSpeed = 4;
            movement.panAccumulatedPixels.x = 10;
            movement.activeInput = true;

            movement.computeCurrentFrameDeltas();
            const secondDelta = movement.panDeltaCurrentFrame.x;

            expect(Math.abs(secondDelta / firstDelta - 2)).toBeLessThan(0.01);
        });

        it("should use per-axis rotation speeds", () => {
            movement.rotationXSpeed = 0.5;
            movement.rotationYSpeed = 2.0;
            movement.rotationAccumulatedPixels.x = 10;
            movement.rotationAccumulatedPixels.y = 10;
            movement.activeInput = true;

            movement.computeCurrentFrameDeltas();

            const ratio = movement.rotationDeltaCurrentFrame.y / movement.rotationDeltaCurrentFrame.x;
            expect(Math.abs(ratio - 4)).toBeLessThan(0.01); // 2.0 / 0.5 = 4
        });

        it("should compute zoom delta with zoomSpeed", () => {
            movement.zoomSpeed = 3;
            movement.zoomAccumulatedPixels = 5;
            movement.activeInput = true;

            movement.computeCurrentFrameDeltas();

            expect(movement.zoomDeltaCurrentFrame).not.toBe(0);
        });

        it("should decay velocity with inertia when no input", () => {
            movement.panInertia = 0.9;
            movement.panAccumulatedPixels.x = 100;
            movement.activeInput = true;
            movement.computeCurrentFrameDeltas();
            const firstDelta = Math.abs(movement.panDeltaCurrentFrame.x);

            movement.panAccumulatedPixels.x = 0;
            movement.activeInput = false;
            movement.computeCurrentFrameDeltas();
            const secondDelta = Math.abs(movement.panDeltaCurrentFrame.x);

            expect(secondDelta).toBeGreaterThan(0);
            expect(secondDelta).toBeLessThan(firstDelta);
        });

        it("should stop instantly with zero inertia", () => {
            movement.panInertia = 0;
            movement.panAccumulatedPixels.x = 100;
            movement.activeInput = true;
            movement.computeCurrentFrameDeltas();

            movement.panAccumulatedPixels.x = 0;
            movement.activeInput = false;
            movement.computeCurrentFrameDeltas();

            expect(movement.panDeltaCurrentFrame.x).toBe(0);
        });

        it("should produce zero deltas with no input", () => {
            movement.computeCurrentFrameDeltas();

            expect(movement.panDeltaCurrentFrame.x).toBe(0);
            expect(movement.panDeltaCurrentFrame.y).toBe(0);
            expect(movement.rotationDeltaCurrentFrame.x).toBe(0);
            expect(movement.rotationDeltaCurrentFrame.y).toBe(0);
            expect(movement.zoomDeltaCurrentFrame).toBe(0);
        });
    });

    describe("resetInputMap", () => {
        it("should reset to empty array in base class", () => {
            movement.inputMap = [{ source: "pointer", button: 0, interaction: "rotate" }];
            movement.resetInputMap();
            expect(movement.inputMap).toEqual([]);
        });
    });
});
