import { FreeCamera } from "core/Cameras/freeCamera";
import { PickingInfo } from "core/Collisions";
import { DeviceEventFactory } from "core/DeviceInput/eventFactory";
import { DeviceType, PointerInput } from "core/DeviceInput/InputDevices/deviceEnums";
import { NullEngine } from "core/Engines/nullEngine";
import { PointerEventTypes, PointerInfo } from "core/Events";
import type { IMouseEvent } from "core/Events/deviceInputEvents";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { TestDeviceInputSystem } from "../DeviceInput/testDeviceInputSystem";

describe("FreeCameraMouseInput", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: Nullable<FreeCamera> = null;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        //engine!._deviceSourceManager = new InternalDeviceSourceManager(engine!);
        scene = new Scene(engine);
        camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl();
    });

    afterEach(() => {
        camera?.dispose();
        scene?.dispose();
        engine?.dispose();
    });

    it("use only one touch input at a time", async () => {
        let cameraRotation = camera!.cameraRotation.clone();
        const testDeviceInputSystem = new TestDeviceInputSystem(
            engine!,
            () => {},
            () => {},
            () => {}
        );
        testDeviceInputSystem.connectDevice(DeviceType.Touch, 2, TestDeviceInputSystem.MAX_POINTER_INPUTS);
        testDeviceInputSystem.connectDevice(DeviceType.Touch, 3, TestDeviceInputSystem.MAX_POINTER_INPUTS);

        // First touch
        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.LeftClick, 1, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Horizontal, 0, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Vertical, 0, false);

        const downEvt1 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 2, PointerInput.LeftClick, 1, testDeviceInputSystem);
        const downPI1 = new PointerInfo(PointerEventTypes.POINTERDOWN, downEvt1 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Horizontal, 10, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Vertical, 10, false);

        const moveEvt1 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 2, PointerInput.Move, 1, testDeviceInputSystem);
        const movePI1 = new PointerInfo(PointerEventTypes.POINTERMOVE, moveEvt1 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.LeftClick, 0, false);

        const upEvt1 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 2, PointerInput.LeftClick, 0, testDeviceInputSystem);
        const upPI1 = new PointerInfo(PointerEventTypes.POINTERUP, upEvt1 as IMouseEvent, new PickingInfo());

        // Second touch
        testDeviceInputSystem.changeInput(DeviceType.Touch, 3, PointerInput.LeftClick, 1, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 3, PointerInput.Horizontal, 20, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 3, PointerInput.Vertical, 20, false);

        const downEvt2 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 3, PointerInput.LeftClick, 1, testDeviceInputSystem);
        const downPI2 = new PointerInfo(PointerEventTypes.POINTERDOWN, downEvt2 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 3, PointerInput.Horizontal, 0, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 3, PointerInput.Vertical, 0, false);

        const moveEvt2 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 2, PointerInput.Move, 1, testDeviceInputSystem);
        const movePI2 = new PointerInfo(PointerEventTypes.POINTERMOVE, moveEvt2 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.LeftClick, 0, false);

        const upEvt2 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 2, PointerInput.LeftClick, 0, testDeviceInputSystem);
        const upPI2 = new PointerInfo(PointerEventTypes.POINTERUP, upEvt2 as IMouseEvent, new PickingInfo());

        // With the first touch, the camera should rotate
        scene?._onCameraInputObservable.notifyObservers(downPI1);
        scene?._onCameraInputObservable.notifyObservers(movePI1);
        expect(camera?.cameraRotation.x).not.toEqual(cameraRotation.x);
        expect(camera?.cameraRotation.y).not.toEqual(cameraRotation.y);

        // With the second touch, the camera should not rotate because the first touch is still active
        cameraRotation = camera!.cameraRotation.clone();
        scene?._onCameraInputObservable.notifyObservers(downPI2);
        scene?._onCameraInputObservable.notifyObservers(movePI2);
        expect(camera?.cameraRotation.x).toEqual(cameraRotation.x);
        expect(camera?.cameraRotation.y).toEqual(cameraRotation.y);
        scene?._onCameraInputObservable.notifyObservers(upPI2);
        scene?._onCameraInputObservable.notifyObservers(upPI1);
    });
});
