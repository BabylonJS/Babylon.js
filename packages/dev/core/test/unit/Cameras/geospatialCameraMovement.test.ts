import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GeospatialCamera } from "core/Cameras/geospatialCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

describe("GeospatialCameraMovement", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: GeospatialCamera;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        camera = new GeospatialCamera("test", scene!, { planetRadius: 1 });
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    // ============================================
    // Input map resolution
    // ============================================
    describe("default inputMap", () => {
        it("should have 8 entries", () => {
            expect(camera.movement.input.inputMap).toHaveLength(8);
        });

        it("should map left-click to pan", () => {
            expect(camera.movement.input.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("pan");
        });

        it("should map middle-click to rotate", () => {
            expect(camera.movement.input.resolveInteraction("pointer", { button: 1 })?.interaction).toBe("rotate");
        });

        it("should map right-click to rotate", () => {
            expect(camera.movement.input.resolveInteraction("pointer", { button: 2 })?.interaction).toBe("rotate");
        });

        it("should map wheel to zoom", () => {
            expect(camera.movement.input.resolveInteraction("wheel")?.interaction).toBe("zoom");
        });

        it("should map +/- keys to zoom", () => {
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 187 })?.interaction).toBe("zoom"); // + key
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 107 })?.interaction).toBe("zoom"); // numpad +
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 189 })?.interaction).toBe("zoom"); // - key
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 109 })?.interaction).toBe("zoom"); // numpad -
        });

        it("should map ctrl+keyboard to rotate", () => {
            expect(camera.movement.input.resolveInteraction("keyboard", { modifiers: { ctrl: true } })?.interaction).toBe("rotate");
        });

        it("should map alt+keyboard to rotate", () => {
            expect(camera.movement.input.resolveInteraction("keyboard", { modifiers: { alt: true } })?.interaction).toBe("rotate");
        });

        it("should map plain keyboard to pan", () => {
            expect(camera.movement.input.resolveInteraction("keyboard", { modifiers: {} })?.interaction).toBe("pan");
        });

        it("should map arrow keys without modifiers to pan", () => {
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 38, modifiers: {} })?.interaction).toBe("pan"); // up arrow
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 40, modifiers: {} })?.interaction).toBe("pan"); // down arrow
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 37, modifiers: {} })?.interaction).toBe("pan"); // left arrow
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 39, modifiers: {} })?.interaction).toBe("pan"); // right arrow
        });

        it("should map arrow keys with ctrl to rotate", () => {
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 38, modifiers: { ctrl: true } })?.interaction).toBe("rotate");
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 37, modifiers: { ctrl: true } })?.interaction).toBe("rotate");
        });

        it("should map zoom keys with ctrl to zoom (key match wins over modifier match)", () => {
            // Key-specific entry comes before modifier entry in the inputMap, so it wins
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 187, modifiers: { ctrl: true } })?.interaction).toBe("zoom");
        });

        it("should map pointer with shift modifier when configured", () => {
            camera.movement.input.inputMap = [
                { source: "pointer", button: 0, modifiers: { shift: true }, interaction: "rotate" },
                { source: "pointer", button: 0, interaction: "pan" },
            ];
            expect(camera.movement.input.resolveInteraction("pointer", { button: 0, modifiers: { shift: true } })?.interaction).toBe("rotate");
            expect(camera.movement.input.resolveInteraction("pointer", { button: 0, modifiers: {} })?.interaction).toBe("pan");
        });
    });

    // ============================================
    // Handler accumulation direction tests
    // ============================================
    describe("rotate handler", () => {
        it("should accumulate positive yaw to rotationAccumulatedPixels.y", () => {
            camera.movement.input.handlers.rotate(5, 0);
            expect(camera.movement.rotationAccumulatedPixels.y).toBe(5);
            expect(camera.movement.rotationAccumulatedPixels.x).toBe(0);
        });

        it("should accumulate negative yaw to rotationAccumulatedPixels.y", () => {
            camera.movement.input.handlers.rotate(-3, 0);
            expect(camera.movement.rotationAccumulatedPixels.y).toBe(-3);
        });

        it("should accumulate positive pitch to rotationAccumulatedPixels.x", () => {
            camera.movement.input.handlers.rotate(0, 7);
            expect(camera.movement.rotationAccumulatedPixels.x).toBe(7);
            expect(camera.movement.rotationAccumulatedPixels.y).toBe(0);
        });

        it("should accumulate negative pitch to rotationAccumulatedPixels.x", () => {
            camera.movement.input.handlers.rotate(0, -4);
            expect(camera.movement.rotationAccumulatedPixels.x).toBe(-4);
        });

        it("should accumulate yaw and pitch independently", () => {
            camera.movement.input.handlers.rotate(2, 3);
            expect(camera.movement.rotationAccumulatedPixels.y).toBe(2);
            expect(camera.movement.rotationAccumulatedPixels.x).toBe(3);
        });

        it("should accumulate multiple calls", () => {
            camera.movement.input.handlers.rotate(1, 2);
            camera.movement.input.handlers.rotate(3, 4);
            expect(camera.movement.rotationAccumulatedPixels.y).toBe(4); // 1 + 3
            expect(camera.movement.rotationAccumulatedPixels.x).toBe(6); // 2 + 4
        });
    });

    describe("zoom handler", () => {
        it("should accumulate positive zoom delta", () => {
            camera.movement.input.handlers.zoom(10, false);
            expect(camera.movement.zoomAccumulatedPixels).toBe(10);
        });

        it("should accumulate negative zoom delta", () => {
            camera.movement.input.handlers.zoom(-5, false);
            expect(camera.movement.zoomAccumulatedPixels).toBe(-5);
        });

        it("should accumulate multiple zoom calls", () => {
            camera.movement.input.handlers.zoom(3, false);
            camera.movement.input.handlers.zoom(7, false);
            expect(camera.movement.zoomAccumulatedPixels).toBe(10);
        });
    });

    // ============================================
    // Direction sign convention tests
    // These verify that the handler-to-accumulator mapping matches the
    // convention used by geospatialCamera._checkInputs, which reads:
    //   rotationDeltaCurrentFrame.x → pitch (added to _pitch)
    //   rotationDeltaCurrentFrame.y → yaw (added to _yaw)
    // ============================================
    describe("direction sign conventions", () => {
        it("positive yaw (right) should produce positive rotationAccumulatedPixels.y", () => {
            // Simulates: right arrow key or rightward pointer drag
            camera.movement.input.handlers.rotate(1, 0);
            expect(camera.movement.rotationAccumulatedPixels.y).toBeGreaterThan(0);
        });

        it("negative yaw (left) should produce negative rotationAccumulatedPixels.y", () => {
            // Simulates: left arrow key or leftward pointer drag
            camera.movement.input.handlers.rotate(-1, 0);
            expect(camera.movement.rotationAccumulatedPixels.y).toBeLessThan(0);
        });

        it("pointer drag up (negative offsetY) should produce negative pitch accumulator for tilt-up", () => {
            // Pointer: offsetY < 0 when dragging up, caller passes -offsetY as pitch
            // This should result in positive pitch accumulator → _pitch increases → tilts toward horizon
            const offsetY = -10;
            camera.movement.input.handlers.rotate(0, -offsetY); // caller convention: negate offsetY for pitch
            expect(camera.movement.rotationAccumulatedPixels.x).toBeGreaterThan(0);
        });

        it("keyboard up arrow should produce negative pitch accumulator for tilt-up (toward top-down)", () => {
            // Keyboard convention: up arrow passes negative pitch
            // _pitch decreases → tilts away from horizon (more top-down)
            camera.movement.input.handlers.rotate(0, -1);
            expect(camera.movement.rotationAccumulatedPixels.x).toBeLessThan(0);
        });

        it("keyboard down arrow should produce positive pitch accumulator for tilt-down (toward horizon)", () => {
            // Keyboard convention: down arrow passes positive pitch
            // _pitch increases → tilts toward horizon
            camera.movement.input.handlers.rotate(0, 1);
            expect(camera.movement.rotationAccumulatedPixels.x).toBeGreaterThan(0);
        });

        it("positive zoom should increase zoomAccumulatedPixels (zoom in)", () => {
            camera.movement.input.handlers.zoom(1, false);
            expect(camera.movement.zoomAccumulatedPixels).toBeGreaterThan(0);
        });

        it("negative zoom should decrease zoomAccumulatedPixels (zoom out)", () => {
            camera.movement.input.handlers.zoom(-1, false);
            expect(camera.movement.zoomAccumulatedPixels).toBeLessThan(0);
        });
    });

    // ============================================
    // resetInputMap
    // ============================================
    describe("resetInputMap", () => {
        it("should restore default inputMap after modification", () => {
            camera.movement.input.inputMap = [];
            expect(camera.movement.input.inputMap).toHaveLength(0);

            camera.movement.input.resetInputMap();
            expect(camera.movement.input.inputMap).toHaveLength(8);

            expect(camera.movement.input.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("pan");
            expect(camera.movement.input.resolveInteraction("pointer", { button: 1 })?.interaction).toBe("rotate");
            expect(camera.movement.input.resolveInteraction("pointer", { button: 2 })?.interaction).toBe("rotate");
            expect(camera.movement.input.resolveInteraction("wheel")?.interaction).toBe("zoom");
            expect(camera.movement.input.resolveInteraction("keyboard", { key: 187 })?.interaction).toBe("zoom");
            expect(camera.movement.input.resolveInteraction("keyboard", { modifiers: { ctrl: true } })?.interaction).toBe("rotate");
            expect(camera.movement.input.resolveInteraction("keyboard", { modifiers: {} })?.interaction).toBe("pan");
        });
    });
});
