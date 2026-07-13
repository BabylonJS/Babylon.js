import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { FlyCamera } from "core/Cameras/flyCamera";
import { FreeCameraTouchInput } from "core/Cameras/Inputs/freeCameraTouchInput";
import { KeyboardEventTypes } from "core/Events/keyboardEvents";
import { PointerEventTypes, PointerInfo } from "core/Events/pointerEvents";
import { PickingInfo } from "core/Collisions/pickingInfo";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type Nullable } from "core/types";

/**
 * Verifies the configurable input wiring added to the keyboard and touch inputs of the
 * TargetCamera family: each consults `camera.movement.input` so the central inputMap can
 * disable or rescale an interaction, while the legacy direct `cameraDirection`/`cameraRotation`
 * writes (and therefore the default behavior) are preserved.
 */
describe("FreeCamera/FlyCamera input map wiring", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        // NullEngine reports a 0ms frame, which would zero `_computeLocalCameraSpeed` and the
        // keyboard rotation step. Force a fixed frame time so movement is deterministic.
        engine.getDeltaTime = () => 16;
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    const pressKey = (keyCode: number) => {
        scene!.onKeyboardObservable.notifyObservers({
            type: KeyboardEventTypes.KEYDOWN,
            event: { keyCode, metaKey: false, preventDefault: () => {} },
        } as any);
    };

    describe("default inputMap", () => {
        it("exposes keyboard translate/rotate and touch rotate/translate entries", () => {
            const camera = new FreeCamera("free", new Vector3(0, 0, 0), scene!);
            const input = camera.movement.input;
            expect(input.getEntry("keyboard", "translate")).toBeDefined();
            expect(input.getEntry("keyboard", "rotate")).toBeDefined();
            expect(input.getEntry("touch", "rotate")).toBeDefined();
            expect(input.getEntry("touch", "translate")).toBeDefined();
        });
    });

    describe("FreeCameraKeyboardMoveInput", () => {
        it("moves forward when a movement key is pressed", () => {
            const camera = new FreeCamera("free", new Vector3(0, 0, 0), scene!);
            camera.attachControl();
            pressKey(38); // up / forward
            camera._checkInputs();
            expect(camera.position.z).toBeGreaterThan(0);
        });

        it("does not translate when the keyboard->translate mapping is removed", () => {
            const camera = new FreeCamera("free", new Vector3(0, 0, 0), scene!);
            camera.attachControl();
            camera.movement.input.inputMap = [];
            pressKey(38);
            camera._checkInputs();
            expect(camera.position.z).toBe(0);
        });

        it("rotates when a rotation key is pressed", () => {
            const camera = new FreeCamera("free", new Vector3(0, 0, 0), scene!);
            const keyboard = camera.inputs.attached.keyboard as any;
            keyboard.keysRotateRight = [68];
            camera.attachControl();
            pressKey(68);
            camera._checkInputs();
            expect(camera.rotation.y).toBeGreaterThan(0);
        });

        it("does not rotate when the keyboard->rotate mapping is removed", () => {
            const camera = new FreeCamera("free", new Vector3(0, 0, 0), scene!);
            const keyboard = camera.inputs.attached.keyboard as any;
            keyboard.keysRotateRight = [68];
            camera.attachControl();
            camera.movement.input.inputMap = camera.movement.input.inputMap.filter((e) => !(e.source === "keyboard" && e.interaction === "rotate"));
            pressKey(68);
            camera._checkInputs();
            expect(camera.rotation.y).toBe(0);
        });

        it("scales translation by an entry sensitivity", () => {
            const baseline = new FreeCamera("base", new Vector3(0, 0, 0), scene!);
            baseline.attachControl();
            pressKey(38);
            baseline._checkInputs();
            const baseZ = baseline.position.z;

            const scaled = new FreeCamera("scaled", new Vector3(0, 0, 0), scene!);
            scaled.movement.input.getEntry("keyboard", "translate")!.sensitivity = 3;
            scaled.attachControl();
            pressKey(38);
            scaled._checkInputs();

            expect(scaled.position.z).toBeCloseTo(baseZ * 3, 5);
        });
    });

    describe("FlyCameraKeyboardInput", () => {
        it("moves when a movement key is pressed", () => {
            const camera = new FlyCamera("fly", new Vector3(0, 0, 0), scene!);
            camera.attachControl();
            pressKey(87); // forward
            camera._checkInputs();
            expect(camera.position.lengthSquared()).toBeGreaterThan(0);
        });

        it("does not move when the keyboard->translate mapping is removed", () => {
            const camera = new FlyCamera("fly", new Vector3(0, 0, 0), scene!);
            camera.attachControl();
            camera.movement.input.inputMap = [];
            pressKey(87);
            camera._checkInputs();
            expect(camera.position.lengthSquared()).toBe(0);
        });
    });

    describe("diagonal movement normalization", () => {
        it("FreeCamera: a two-axis diagonal moves at the same speed as a single axis (no sqrt(2) boost)", () => {
            const single = new FreeCamera("single", new Vector3(0, 0, 0), scene!);
            single.attachControl();
            pressKey(38); // forward
            single._checkInputs();
            const singleDist = single.position.length();
            single.detachControl();

            const diagonal = new FreeCamera("diagonal", new Vector3(0, 0, 0), scene!);
            diagonal.attachControl();
            pressKey(38); // forward
            pressKey(37); // left strafe
            diagonal._checkInputs();
            const diagonalDist = diagonal.position.length();

            expect(singleDist).toBeGreaterThan(0);
            expect(diagonalDist).toBeCloseTo(singleDist, 5);
        });

        it("FlyCamera: a two-axis diagonal moves at the same speed as a single axis (no sqrt(2) boost)", () => {
            const single = new FlyCamera("single", new Vector3(0, 0, 0), scene!);
            single.attachControl();
            pressKey(87); // forward
            single._checkInputs();
            const singleDist = single.position.length();
            single.detachControl();

            const diagonal = new FlyCamera("diagonal", new Vector3(0, 0, 0), scene!);
            diagonal.attachControl();
            pressKey(87); // forward
            pressKey(65); // left strafe
            diagonal._checkInputs();
            const diagonalDist = diagonal.position.length();

            expect(singleDist).toBeGreaterThan(0);
            expect(diagonalDist).toBeCloseTo(singleDist, 5);
        });
    });

    describe("FreeCameraTouchInput", () => {
        const dragOneFinger = (input: FreeCameraTouchInput, dx: number, dy: number) => {
            const down = new PointerInfo(
                PointerEventTypes.POINTERDOWN,
                { pointerId: 1, clientX: 0, clientY: 0, pointerType: "touch", preventDefault: () => {} } as any,
                new PickingInfo()
            );
            const move = new PointerInfo(
                PointerEventTypes.POINTERMOVE,
                { pointerId: 1, clientX: dx, clientY: dy, pointerType: "touch", preventDefault: () => {} } as any,
                new PickingInfo()
            );
            scene!.onPointerObservable.notifyObservers(down);
            scene!.onPointerObservable.notifyObservers(move);
            input.checkInputs();
        };

        it("applies yaw rotation gated on touch->rotate", () => {
            const camera = new FreeCamera("free", new Vector3(0, 0, 0), scene!);
            const input = new FreeCameraTouchInput();
            // Only the touch input should be active; the default mouse input also rotates on
            // touch pointer events and would otherwise mask the touch-specific behavior.
            camera.inputs.clear();
            camera.inputs.add(input);
            camera.attachControl();

            dragOneFinger(input, 50, 0);
            expect(camera.cameraRotation.y).not.toBe(0);
        });

        it("does not rotate when touch->rotate mappings are removed", () => {
            const camera = new FreeCamera("free", new Vector3(0, 0, 0), scene!);
            const input = new FreeCameraTouchInput();
            camera.inputs.clear();
            camera.inputs.add(input);
            camera.attachControl();
            camera.movement.input.inputMap = camera.movement.input.inputMap.filter((e) => !(e.source === "touch" && e.interaction === "rotate"));

            dragOneFinger(input, 50, 0);
            expect(camera.cameraRotation.y).toBe(0);
        });

        it("does not move when touch->translate mappings are removed", () => {
            const camera = new FreeCamera("free", new Vector3(0, 0, 0), scene!);
            const input = new FreeCameraTouchInput();
            camera.inputs.clear();
            camera.inputs.add(input);
            camera.attachControl();
            camera.movement.input.inputMap = camera.movement.input.inputMap.filter((e) => !(e.source === "touch" && e.interaction === "translate"));

            dragOneFinger(input, 0, 50);
            expect(camera.cameraDirection.lengthSquared()).toBe(0);
        });
    });
});
