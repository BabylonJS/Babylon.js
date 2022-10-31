import type { ICameraInput } from "core/Cameras";
import { CameraInputsManager, FreeCamera } from "core/Cameras";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import { Scene } from "core/scene";

describe("CameraInputsManager", () => {
    let subject: Engine;
    let scene: Scene;

    beforeEach(() => {
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
        let camera: FreeCamera;
        let manager: CameraInputsManager<FreeCamera>;
        let input: ICameraInput<FreeCamera>;

        beforeEach(() => {
            camera = new FreeCamera("camera", Vector3.Zero(), scene);
            manager = new CameraInputsManager(camera);
            input = {
                camera: null,
                getClassName: () => "CustomInput",
                getSimpleName: () => "SimpleCustomInput",
                attachControl: () => undefined,
                detachControl: () => undefined,
                checkInputs: () => undefined,
            };
        });

        it("should add a new input", () => {
            // initially the manager should not have any input attached
            expect(manager.attached).toEqual({});

            // after add new input the manager should have the new input attached
            manager.add(input);

            expect(Object.keys(manager.attached).length).toEqual(1);
            expect(manager.attached[input.getSimpleName()]).toEqual(input);

            // added input should have actual camera attached
            expect(input.camera).toEqual(camera);
        });

        it("should not override existed input with same type", () => {
            manager.add(input);

            // manager should have attached input
            expect(manager.attached[input.getSimpleName()]).toEqual(input);

            // now add a new input with same type
            const newInput: ICameraInput<FreeCamera> = {
                camera: null,
                getClassName: () => "CustomInput",
                getSimpleName: () => "SimpleCustomInput",
                attachControl: () => undefined,
                detachControl: () => undefined,
                checkInputs: () => undefined,
            };
            manager.add(newInput);

            // manager should stay an old input
            expect(manager.attached[newInput.getSimpleName()]).not.toEqual(newInput);
        });

        it("should attach control when it required", () => {
            const attachControlSpy = jest.spyOn(input, "attachControl");
            manager.attachedToElement = true;
            manager.add(input);

            expect(attachControlSpy).toHaveBeenCalledWith(undefined);
        });

        it("should attach control when it required with preventDefault", () => {
            const attachControlSpy = jest.spyOn(input, "attachControl");
            manager.attachedToElement = true;
            manager.noPreventDefault = true;
            manager.add(input);

            expect(attachControlSpy).toHaveBeenCalledWith(true);
        });
    });

    describe("remove", () => {
        let camera: FreeCamera;
        let manager: CameraInputsManager<FreeCamera>;
        let input: ICameraInput<FreeCamera>;

        beforeEach(() => {
            camera = new FreeCamera("camera", Vector3.Zero(), scene);
            manager = new CameraInputsManager(camera);
            input = {
                camera: null,
                getClassName: () => "CustomInput",
                getSimpleName: () => "SimpleCustomInput",
                attachControl: () => undefined,
                detachControl: () => undefined,
                checkInputs: () => undefined,
            };
        });

        it("should remove attached input", () => {
            manager.add(input);

            // manager should have attached input
            expect(manager.attached[input.getSimpleName()]).toEqual(input);

            // now remove the input
            manager.remove(input);

            // manager should not have attached input
            expect(manager.attached[input.getSimpleName()]).toBeUndefined();
        });

        it("should not remove not attached input with same name", () => {
            manager.add(input);

            // now create a new input with same name
            const newInput: ICameraInput<FreeCamera> = {
                camera: null,
                getClassName: () => "CustomInput",
                getSimpleName: () => "SimpleCustomInput",
                attachControl: () => undefined,
                detachControl: () => undefined,
                checkInputs: () => undefined,
            };

            // try to remove the new input with same name
            manager.remove(newInput);

            // manager should stay have attached initial input
            expect(manager.attached[newInput.getSimpleName()]).toEqual(input);
        });

        it("should call rebuild input check after remove the input", () => {
            const managerRebuildInputCheckSpy = jest.spyOn(manager, "rebuildInputCheck");

            manager.add(input);

            // now remove the input
            manager.remove(input);

            // manager should call rebuild input check, and only once
            expect(managerRebuildInputCheckSpy).toHaveBeenCalledTimes(1);
        });

        it("should detach control from input", () => {
            const detachControlSpy = jest.spyOn(input, "detachControl");

            manager.add(input);

            // now remove the input
            manager.remove(input);

            // manager should call detach control
            expect(detachControlSpy).toHaveBeenCalledTimes(1);
        });

        it("should remove camera from input", () => {
            manager.add(input);

            expect(input.camera).toEqual(camera);

            // now remove the input and check the camera
            manager.remove(input);
            expect(input.camera).toBeFalsy();
        });
    });
});
