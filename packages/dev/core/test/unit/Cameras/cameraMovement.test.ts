import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CameraMovement } from "core/Cameras/cameraMovement";
import { InputMapper } from "core/Cameras/inputMapper";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

describe("InputMapper", () => {
    // Dummy handlers for testing — InputMapper needs handler keys to match interaction strings
    type TestHandlers = { rotate: () => void; translate: () => void; zoom: () => void; pan: () => void };
    const noop = () => {};
    let mapper: InputMapper<TestHandlers>;

    beforeEach(() => {
        mapper = new InputMapper<TestHandlers>({ rotate: noop, translate: noop, zoom: noop, pan: noop });
    });

    describe("resolveInteraction", () => {
        it("should match by source type", () => {
            mapper.inputMap = [
                { source: "pointer", button: 0, interaction: "rotate" },
                { source: "keyboard", interaction: "translate" },
                { source: "wheel", interaction: "zoom" },
                { source: "touch", interaction: "pan" },
            ];

            expect(mapper.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("rotate");
            expect(mapper.resolveInteraction("keyboard")?.interaction).toBe("translate");
            expect(mapper.resolveInteraction("wheel")?.interaction).toBe("zoom");
            expect(mapper.resolveInteraction("touch")?.interaction).toBe("pan");
        });

        it("should return first match when multiple entries exist for same source", () => {
            mapper.inputMap = [
                { source: "pointer", button: 0, interaction: "rotate" },
                { source: "pointer", button: 0, interaction: "pan" },
            ];

            expect(mapper.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("rotate");
        });

        it("should match exact modifiers", () => {
            mapper.inputMap = [{ source: "keyboard", modifiers: { ctrl: true }, interaction: "pan" }];

            expect(mapper.resolveInteraction("keyboard", { modifiers: { ctrl: true } })?.interaction).toBe("pan");
            expect(mapper.resolveInteraction("keyboard", { modifiers: { ctrl: false } })).toBeNull();
        });

        it("should match when entry has no modifiers (matches anything)", () => {
            mapper.inputMap = [{ source: "keyboard", interaction: "rotate" }];

            expect(mapper.resolveInteraction("keyboard", { modifiers: { ctrl: true } })?.interaction).toBe("rotate");
            expect(mapper.resolveInteraction("keyboard")?.interaction).toBe("rotate");
        });

        it("should match partial modifiers (only check specified keys)", () => {
            mapper.inputMap = [{ source: "keyboard", modifiers: { ctrl: true }, interaction: "pan" }];

            expect(mapper.resolveInteraction("keyboard", { modifiers: { ctrl: true, shift: true } })?.interaction).toBe("pan");
        });

        it("should match pointer button", () => {
            mapper.inputMap = [{ source: "pointer", button: 2, interaction: "pan" }];

            expect(mapper.resolveInteraction("pointer", { button: 2 })?.interaction).toBe("pan");
            expect(mapper.resolveInteraction("pointer", { button: 0 })).toBeNull();
        });

        it("should match touch count", () => {
            mapper.inputMap = [{ source: "touch", touchCount: 2, interaction: "zoom" }];

            expect(mapper.resolveInteraction("touch", { touchCount: 2 })?.interaction).toBe("zoom");
            expect(mapper.resolveInteraction("touch", { touchCount: 1 })).toBeNull();
        });

        it("should return null when no entry matches", () => {
            mapper.inputMap = [{ source: "pointer", button: 0, interaction: "rotate" }];

            expect(mapper.resolveInteraction("keyboard")).toBeNull();
        });

        it("should return null with empty inputMap", () => {
            mapper.inputMap = [];
            expect(mapper.resolveInteraction("pointer", { button: 0 })).toBeNull();
        });

        it("should return sensitivity from matched entry", () => {
            mapper.inputMap = [{ source: "pointer", button: 0, interaction: "rotate", sensitivity: 0.5 }];
            expect(mapper.resolveInteraction("pointer", { button: 0 })?.sensitivity).toBe(0.5);
        });

        it("should return undefined sensitivity when not specified", () => {
            mapper.inputMap = [{ source: "pointer", button: 0, interaction: "rotate" }];
            expect(mapper.resolveInteraction("pointer", { button: 0 })?.sensitivity).toBeUndefined();
        });
    });

    describe("resetInputMap", () => {
        it("should reset to empty array when no factory provided", () => {
            mapper.inputMap = [{ source: "pointer", button: 0, interaction: "rotate" }];
            mapper.resetInputMap();
            expect(mapper.inputMap).toEqual([]);
        });

        it("should reset to factory-provided defaults", () => {
            const defaults = [
                { source: "pointer" as const, button: 0, interaction: "rotate" as const },
                { source: "wheel" as const, interaction: "zoom" as const },
            ];
            const mapperWithDefaults = new InputMapper<TestHandlers>({ rotate: noop, translate: noop, zoom: noop, pan: noop }, () => [...defaults]);
            expect(mapperWithDefaults.inputMap).toHaveLength(2);

            mapperWithDefaults.inputMap = [];
            mapperWithDefaults.resetInputMap();
            expect(mapperWithDefaults.inputMap).toHaveLength(2);
            expect(mapperWithDefaults.inputMap[0].interaction).toBe("rotate");
        });
    });

    describe("getEntry", () => {
        it("should find entry by source and interaction", () => {
            mapper.inputMap = [
                { source: "pointer", button: 0, interaction: "rotate" },
                { source: "pointer", button: 2, interaction: "pan" },
            ];
            expect(mapper.getEntry("pointer", "pan")?.source).toBe("pointer");
            expect(mapper.getEntry("pointer", "zoom")).toBeUndefined();
        });

        it("should find entry by optional entry conditions", () => {
            mapper.inputMap = [
                { source: "pointer", button: 0, modifiers: { ctrl: true }, interaction: "pan" },
                { source: "pointer", button: 2, interaction: "pan" },
            ];

            expect(mapper.getEntry("pointer", "pan", { modifiers: {} })?.button).toBe(2);
            expect(mapper.getEntry("pointer", "pan", { button: 0, modifiers: { ctrl: true } })?.modifiers?.ctrl).toBe(true);
            expect(mapper.getEntry("pointer", "pan", { button: 1 })).toBeUndefined();
        });

        it("should find all entries by source, interaction, and optional entry conditions", () => {
            mapper.inputMap = [
                { source: "keyboard", modifiers: { ctrl: true }, interaction: "pan", sensitivity: 2 },
                { source: "keyboard", modifiers: { alt: true }, interaction: "pan", sensitivity: 3 },
                { source: "keyboard", interaction: "pan", sensitivity: 4 },
                { source: "pointer", button: 2, interaction: "pan" },
            ];

            expect(mapper.getEntries("keyboard", "pan")).toHaveLength(3);
            expect(mapper.getEntries("keyboard", "pan", { modifiers: { ctrl: true } })).toEqual([mapper.inputMap[0]]);
            expect(mapper.getEntries("keyboard", "pan", { modifiers: {} })).toEqual([mapper.inputMap[2]]);
        });
    });

    describe("addEntry", () => {
        it("should insert more specific entries before less specific ones", () => {
            mapper.inputMap = [{ source: "keyboard", interaction: "rotate" }];
            mapper.addEntry({ source: "keyboard", modifiers: { ctrl: true }, interaction: "pan" });
            expect(mapper.inputMap[0].interaction).toBe("pan");
            expect(mapper.inputMap[1].interaction).toBe("rotate");
        });
    });

    describe("setInteraction", () => {
        it("should mutate the matching entry in place when it is as specific as the conditions", () => {
            mapper.inputMap = [
                { source: "pointer", button: 0, modifiers: { ctrl: true }, interaction: "pan" },
                { source: "pointer", button: 0, interaction: "rotate" },
            ];

            const result = mapper.setInteraction("pointer", { button: 0, modifiers: { ctrl: true } }, "rotate");

            expect(result).toBe(true);
            expect(mapper.inputMap.length).toBe(2);
            expect(mapper.inputMap[0].interaction).toBe("rotate");
            expect(mapper.inputMap[1].interaction).toBe("rotate");
        });

        it("should add a new specific entry when the matched entry is broader (modifier-broader case)", () => {
            // The catch-all { button: 0, interaction: "pan" } would match a ctrl+left-drag query
            // but does not constrain ctrl. Old behavior would mutate it and break unmodified left-drag;
            // new behavior must add a more-specific entry instead.
            mapper.inputMap = [{ source: "pointer", button: 0, interaction: "pan" }];

            const result = mapper.setInteraction("pointer", { button: 0, modifiers: { ctrl: true } }, "rotate");

            expect(result).toBe(true);
            expect(mapper.inputMap.length).toBe(2);
            // The new specific entry must come first so it wins for ctrl+left-drag
            const ctrlMatch = mapper.resolveInteraction("pointer", { button: 0, modifiers: { ctrl: true } });
            expect(ctrlMatch?.interaction).toBe("rotate");
            // Plain left-drag still resolves to the original catch-all
            const plainMatch = mapper.resolveInteraction("pointer", { button: 0, modifiers: { ctrl: false } });
            expect(plainMatch?.interaction).toBe("pan");
        });

        it("should add a new specific entry when the matched entry is broader (button-broader case)", () => {
            // The catch-all { source: "wheel", interaction: "zoom" } does not constrain modifiers.
            // Adding a shift+wheel→pan binding via setInteraction must not flip the catch-all.
            mapper.inputMap = [{ source: "wheel", interaction: "zoom" }];

            mapper.setInteraction("wheel", { modifiers: { shift: true } }, "pan");

            expect(mapper.inputMap.length).toBe(2);
            expect(mapper.resolveInteraction("wheel", { modifiers: { shift: true } })?.interaction).toBe("pan");
            expect(mapper.resolveInteraction("wheel", { modifiers: { shift: false } })?.interaction).toBe("zoom");
        });

        it("should add a new entry when no entry matches at all", () => {
            mapper.inputMap = [{ source: "pointer", button: 0, interaction: "pan" }];

            mapper.setInteraction("keyboard", { modifiers: { ctrl: true } }, "rotate");

            expect(mapper.inputMap.length).toBe(2);
            expect(mapper.resolveInteraction("keyboard", { modifiers: { ctrl: true } })?.interaction).toBe("rotate");
        });

        it("should add a new less-specific entry when conditions don't match any existing entry (entries are more specific)", () => {
            // Entry constrains { button: 0, modifiers: { ctrl: true } }; conditions only specify
            // { modifiers: { ctrl: true } }. resolveInteraction returns null because entries are
            // not wildcards in reverse (an entry with button: 0 doesn't match conditions without
            // a button). The new behavior adds a new entry that matches the request.
            mapper.inputMap = [
                { source: "pointer", button: 0, modifiers: { ctrl: true }, interaction: "pan" },
            ];

            mapper.setInteraction("pointer", { modifiers: { ctrl: true } }, "rotate");

            expect(mapper.inputMap.length).toBe(2);
            // The button-constrained original entry stays first (more specific) and wins for
            // ctrl+left-drag; the new less-specific entry handles ctrl+other-buttons.
            expect(mapper.resolveInteraction("pointer", { button: 0, modifiers: { ctrl: true } })?.interaction).toBe("pan");
            expect(mapper.resolveInteraction("pointer", { button: 2, modifiers: { ctrl: true } })?.interaction).toBe("rotate");
        });
    });

    describe("setInteractions", () => {
        it("should update every matching entry and return the count", () => {
            mapper.inputMap = [
                { source: "pointer", button: 0, interaction: "rotate" },
                { source: "pointer", button: 0, interaction: "pan" },
                { source: "pointer", button: 2, interaction: "pan" },
            ];

            const updated = mapper.setInteractions("pointer", { button: 0 }, "zoom");

            expect(updated).toBe(2);
            expect(mapper.inputMap[0].interaction).toBe("zoom");
            expect(mapper.inputMap[1].interaction).toBe("zoom");
            expect(mapper.inputMap[2].interaction).toBe("pan");
        });

        it("should return 0 when no entries match", () => {
            mapper.inputMap = [{ source: "pointer", button: 0, interaction: "rotate" }];

            expect(mapper.setInteractions("keyboard", undefined, "zoom")).toBe(0);
            expect(mapper.inputMap[0].interaction).toBe("rotate");
        });

        it("should also update entries with no conditions when conditions match (wildcard semantics)", () => {
            mapper.inputMap = [
                { source: "keyboard", interaction: "rotate" },
                { source: "keyboard", modifiers: { ctrl: true }, interaction: "pan" },
            ];

            const updated = mapper.setInteractions("keyboard", { modifiers: { ctrl: true } }, "zoom");

            expect(updated).toBe(2);
            expect(mapper.inputMap[0].interaction).toBe("zoom");
            expect(mapper.inputMap[1].interaction).toBe("zoom");
        });
    });
});

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
        // Mock getDeltaTime to return a stable 16.67ms (60fps)
        vi.spyOn(engine, "getDeltaTime").mockReturnValue(1000 / 60);
        movement = new CameraMovement(scene, Vector3.Zero());
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
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

            // Reset velocity to isolate the speed multiplier effect from cross-frame accumulation
            movement.resetPanVelocity();
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
            expect(Math.abs(ratio - 4)).toBeLessThan(0.01);
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
});
