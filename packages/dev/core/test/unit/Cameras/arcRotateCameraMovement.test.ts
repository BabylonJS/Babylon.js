import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

describe("ArcRotateCameraMovement", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: ArcRotateCamera;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        camera = new ArcRotateCamera("test", 0, 0, 10, Vector3.Zero(), scene);
        camera.useMovementSystem = true;
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    describe("default inputMap", () => {
        it("should have exactly 7 entries", () => {
            expect(camera.movement!.input.inputMap).toHaveLength(7);
        });

        it("should map left-click to rotate", () => {
            expect(camera.movement!.input.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("rotate");
        });

        it("should map right-click to pan", () => {
            expect(camera.movement!.input.resolveInteraction("pointer", { button: 2 })?.interaction).toBe("pan");
        });

        it("should map wheel to zoom", () => {
            expect(camera.movement!.input.resolveInteraction("wheel")?.interaction).toBe("zoom");
        });

        it("should map +/- keys to zoom", () => {
            expect(camera.movement!.input.resolveInteraction("keyboard", { key: 187 })?.interaction).toBe("zoom"); // + key
            expect(camera.movement!.input.resolveInteraction("keyboard", { key: 107 })?.interaction).toBe("zoom"); // numpad +
            expect(camera.movement!.input.resolveInteraction("keyboard", { key: 189 })?.interaction).toBe("zoom"); // - key
            expect(camera.movement!.input.resolveInteraction("keyboard", { key: 109 })?.interaction).toBe("zoom"); // numpad -
        });

        it("should map zoom keys with ctrl to zoom (key match wins over modifier match)", () => {
            expect(camera.movement!.input.resolveInteraction("keyboard", { key: 187, modifiers: { ctrl: true } })?.interaction).toBe("zoom");
        });

        it("should map ctrl+keyboard to pan", () => {
            expect(camera.movement!.input.resolveInteraction("keyboard", { modifiers: { ctrl: true } })?.interaction).toBe("pan");
        });

        it("should map alt+keyboard to zoom", () => {
            expect(camera.movement!.input.resolveInteraction("keyboard", { modifiers: { alt: true } })?.interaction).toBe("zoom");
        });

        it("should map plain keyboard to rotate", () => {
            expect(camera.movement!.input.resolveInteraction("keyboard", { modifiers: {} })?.interaction).toBe("rotate");
        });
    });

    describe("default handlers", () => {
        it("should accumulate pan deltas", () => {
            camera.movement!.input.handlers.pan(5, 10);
            expect(camera.movement!.panAccumulatedPixels.x).toBe(5);
            expect(camera.movement!.panAccumulatedPixels.y).toBe(10);
        });

        it("should accumulate rotation deltas", () => {
            camera.movement!.input.handlers.rotate(3, 7);
            expect(camera.movement!.rotationAccumulatedPixels.x).toBe(3);
            expect(camera.movement!.rotationAccumulatedPixels.y).toBe(7);
        });

        it("should accumulate zoom deltas", () => {
            camera.movement!.input.handlers.zoom(4);
            expect(camera.movement!.zoomAccumulatedPixels).toBe(4);
        });

        it("should accumulate multiple calls", () => {
            camera.movement!.input.handlers.pan(1, 2);
            camera.movement!.input.handlers.pan(1, 2);
            expect(camera.movement!.panAccumulatedPixels.x).toBe(2);
            expect(camera.movement!.panAccumulatedPixels.y).toBe(4);
        });
    });

    describe("resetInputMap", () => {
        it("should restore default inputMap after modification", () => {
            camera.movement!.input.inputMap = [];
            expect(camera.movement!.input.inputMap).toHaveLength(0);

            camera.movement!.input.resetInputMap();
            expect(camera.movement!.input.inputMap).toHaveLength(7);

            expect(camera.movement!.input.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("rotate");
            expect(camera.movement!.input.resolveInteraction("pointer", { button: 2 })?.interaction).toBe("pan");
            expect(camera.movement!.input.resolveInteraction("wheel")?.interaction).toBe("zoom");
            expect(camera.movement!.input.resolveInteraction("keyboard", { key: 187 })?.interaction).toBe("zoom");
            expect(camera.movement!.input.resolveInteraction("keyboard", { modifiers: { ctrl: true } })?.interaction).toBe("pan");
            expect(camera.movement!.input.resolveInteraction("keyboard", { modifiers: { alt: true } })?.interaction).toBe("zoom");
            expect(camera.movement!.input.resolveInteraction("keyboard", { modifiers: {} })?.interaction).toBe("rotate");
        });
    });
});
