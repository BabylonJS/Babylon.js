import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ArcRotateCameraMovement } from "core/Cameras/arcRotateCameraMovement";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

describe("ArcRotateCameraMovement", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let movement: ArcRotateCameraMovement;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        movement = new ArcRotateCameraMovement(scene, Vector3.Zero());
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    describe("default inputMap", () => {
        it("should have exactly 7 entries", () => {
            expect(movement.inputMap).toHaveLength(7);
        });

        it("should map left-click to rotate", () => {
            expect(movement.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("rotate");
        });

        it("should map right-click to pan", () => {
            expect(movement.resolveInteraction("pointer", { button: 2 })?.interaction).toBe("pan");
        });

        it("should map wheel to zoom", () => {
            expect(movement.resolveInteraction("wheel")?.interaction).toBe("zoom");
        });

        it("should map +/- keys to zoom", () => {
            expect(movement.resolveInteraction("keyboard", { key: 187 })?.interaction).toBe("zoom"); // + key
            expect(movement.resolveInteraction("keyboard", { key: 107 })?.interaction).toBe("zoom"); // numpad +
            expect(movement.resolveInteraction("keyboard", { key: 189 })?.interaction).toBe("zoom"); // - key
            expect(movement.resolveInteraction("keyboard", { key: 109 })?.interaction).toBe("zoom"); // numpad -
        });

        it("should map zoom keys with ctrl to zoom (key match wins over modifier match)", () => {
            expect(movement.resolveInteraction("keyboard", { key: 187, modifiers: { ctrl: true } })?.interaction).toBe("zoom");
        });

        it("should map ctrl+keyboard to pan", () => {
            expect(movement.resolveInteraction("keyboard", { modifiers: { ctrl: true } })?.interaction).toBe("pan");
        });

        it("should map alt+keyboard to zoom", () => {
            expect(movement.resolveInteraction("keyboard", { modifiers: { alt: true } })?.interaction).toBe("zoom");
        });

        it("should map plain keyboard to rotate", () => {
            expect(movement.resolveInteraction("keyboard", { modifiers: {} })?.interaction).toBe("rotate");
        });
    });

    describe("default handlers", () => {
        it("should accumulate pan deltas", () => {
            movement.handlers.pan(5, 10);
            expect(movement.panAccumulatedPixels.x).toBe(5);
            expect(movement.panAccumulatedPixels.y).toBe(10);
        });

        it("should accumulate rotation deltas", () => {
            movement.handlers.rotate(3, 7);
            expect(movement.rotationAccumulatedPixels.x).toBe(3);
            expect(movement.rotationAccumulatedPixels.y).toBe(7);
        });

        it("should accumulate zoom deltas", () => {
            movement.handlers.zoom(4);
            expect(movement.zoomAccumulatedPixels).toBe(4);
        });

        it("should accumulate multiple calls", () => {
            movement.handlers.pan(1, 2);
            movement.handlers.pan(1, 2);
            expect(movement.panAccumulatedPixels.x).toBe(2);
            expect(movement.panAccumulatedPixels.y).toBe(4);
        });
    });

    describe("resetInputMap", () => {
        it("should restore default inputMap after modification", () => {
            movement.inputMap = [];
            expect(movement.inputMap).toHaveLength(0);

            movement.resetInputMap();
            expect(movement.inputMap).toHaveLength(7);

            expect(movement.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("rotate");
            expect(movement.resolveInteraction("pointer", { button: 2 })?.interaction).toBe("pan");
            expect(movement.resolveInteraction("wheel")?.interaction).toBe("zoom");
            expect(movement.resolveInteraction("keyboard", { key: 187 })?.interaction).toBe("zoom");
            expect(movement.resolveInteraction("keyboard", { modifiers: { ctrl: true } })?.interaction).toBe("pan");
            expect(movement.resolveInteraction("keyboard", { modifiers: { alt: true } })?.interaction).toBe("zoom");
            expect(movement.resolveInteraction("keyboard", { modifiers: {} })?.interaction).toBe("rotate");
        });
    });
});
