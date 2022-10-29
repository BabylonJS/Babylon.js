import { CameraInputsManager, FreeCamera } from 'core/Cameras';
import type { Engine } from 'core/Engines';
import { NullEngine } from 'core/Engines';
import { Vector3 } from 'core/Maths';
import { Scene } from 'core/scene';


describe("CameraInputsManager", () => {
    let subject: Engine;
    let scene: Scene;

    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(subject);
    });

    describe("add", () => {
        it("should add a new input", () => {
            const camera = new FreeCamera("camera", Vector3.Zero(), scene);
            const manager = new CameraInputsManager(camera);

            // initially the manager should not have any input attached
            expect(manager.attached).toEqual({});

            // after add new input the manager should have the new input attached
            const input = {
                camera: null,
                getClassName: () => 'CustomInput',
                getSimpleName: () => 'SimpleCustomInput',
                attachControl: () => undefined,
                detachControl: () => undefined,
                checkInputs: () => undefined,
            };
            manager.add(input);

            expect(Object.keys(manager.attached).length).toEqual(1);
            expect(manager.attached[input.getSimpleName()]).toEqual(input);

            // added input should have actual camera attached
            expect(input.camera).toEqual(camera);
        });
    });
});
