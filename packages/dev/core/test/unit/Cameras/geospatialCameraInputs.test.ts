import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GeospatialCamera } from "core/Cameras/geospatialCamera";
import { GeospatialCameraPointersInput } from "core/Cameras/Inputs/geospatialCameraPointersInput";
import { GeospatialCameraKeyboardInput } from "core/Cameras/Inputs/geospatialCameraKeyboardInput";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { SineEase } from "core/Animations/easing";
import { type IPointerEvent } from "core/Events/deviceInputEvents";
import { type Nullable } from "core/types";

describe("GeospatialCamera inputs", () => {
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
    // Double tap (pointers input)
    // ============================================
    describe("double tap", () => {
        const makeEvt = (button: number, buttons: number): IPointerEvent => ({ button, buttons, pointerType: "mouse" }) as IPointerEvent;

        let input: GeospatialCameraPointersInput;
        let flySpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            input = new GeospatialCameraPointersInput();
            input.camera = camera;
            vi.spyOn(camera._scene, "pick").mockReturnValue({ pickedPoint: new Vector3(1, 0, 0) } as any);
            flySpy = vi.spyOn(camera, "flyToPointAsync").mockResolvedValue(undefined as any);
        });

        it("should fly to point on a primary-button double tap", () => {
            input.onDoubleTap("mouse", makeEvt(0, 0));
            expect(flySpy).toHaveBeenCalledTimes(1);
        });

        it("should ignore a non-primary (right) button double tap", () => {
            input.onDoubleTap("mouse", makeEvt(2, 0));
            expect(flySpy).not.toHaveBeenCalled();
        });

        it("should ignore a double tap while another button is held", () => {
            // Primary button released but right button (bit 2) still pressed.
            input.onDoubleTap("mouse", makeEvt(0, 2));
            expect(flySpy).not.toHaveBeenCalled();
        });

        it("should still fly when no event is provided (back-compat)", () => {
            input.onDoubleTap("mouse");
            expect(flySpy).toHaveBeenCalledTimes(1);
        });

        it("should forward configured duration and easing function", () => {
            const easing = new SineEase();
            input.doubleTapAnimationDurationMs = 500;
            input.doubleTapEasingFunction = easing;
            input.onDoubleTap("mouse", makeEvt(0, 0));
            expect(flySpy).toHaveBeenCalledWith(expect.anything(), undefined, 500, easing);
        });
    });

    // ============================================
    // Keyboard pan normalization
    // ============================================
    describe("keyboard pan normalization", () => {
        let keyboard: GeospatialCameraKeyboardInput;
        let startSpy: ReturnType<typeof vi.spyOn>;
        let updateSpy: ReturnType<typeof vi.spyOn>;

        const panHandler = () => camera.movement.input.handlers.pan;

        beforeEach(() => {
            keyboard = new GeospatialCameraKeyboardInput();
            keyboard.camera = camera;
            // Wire up the internals normally set by attachControl so checkInputs runs.
            (keyboard as any)._engine = engine;
            (keyboard as any)._scene = scene;
            (keyboard as any)._onKeyboardObserver = {};

            startSpy = vi.spyOn(panHandler(), "start").mockImplementation(() => {});
            updateSpy = vi.spyOn(panHandler(), "update").mockImplementation(() => {});
            vi.spyOn(panHandler(), "stop").mockImplementation(() => {});
        });

        // Returns the magnitude of the pan offset (update position relative to start position).
        const runAndMeasure = (keys: number[]): number => {
            startSpy.mockClear();
            updateSpy.mockClear();
            (keyboard as any)._keys = keys;
            keyboard.checkInputs();
            // A single, combined pan must be issued regardless of how many direction keys are held.
            expect(updateSpy).toHaveBeenCalledTimes(1);
            const [startX, startY] = startSpy.mock.calls[0] as number[];
            const [updateX, updateY] = updateSpy.mock.calls[0] as number[];
            const dx = updateX - startX;
            const dy = updateY - startY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        it("should produce equal pan speed for a single direction and a diagonal (no sqrt(2) boost)", () => {
            const single = runAndMeasure([38]); // up
            const diagonal = runAndMeasure([38, 37]); // up + left
            expect(diagonal).toBeCloseTo(single, 5);
        });

        it("should not pan when no direction keys are held", () => {
            (keyboard as any)._keys = [];
            keyboard.checkInputs();
            expect(updateSpy).not.toHaveBeenCalled();
        });

        it("should not pan (and not divide by zero) when opposite direction keys cancel out", () => {
            // up + down nets to a zero direction vector; the guard must skip normalization to avoid 0/0.
            (keyboard as any)._keys = [38, 40]; // up + down
            keyboard.checkInputs();
            expect(updateSpy).not.toHaveBeenCalled();
        });
    });
});
