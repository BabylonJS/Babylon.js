import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
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

describe("ArcRotateCameraMouseInput", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: Nullable<ArcRotateCamera> = null;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(engine);
        camera = new ArcRotateCamera("camera", 0, 0, 10, Vector3.Zero(), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl();
    });

    afterEach(() => {
        camera?.dispose();
        scene?.dispose();
        engine?.dispose();
    });

    it("ignores any touch inputs after the second", () => {
        let radius = camera!.radius;
        const alpha = camera!.alpha;
        const beta = camera!.beta;
        const testDeviceInputSystem = new TestDeviceInputSystem(
            engine!,
            () => {},
            () => {},
            () => {}
        );
        testDeviceInputSystem.connectDevice(DeviceType.Touch, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);
        testDeviceInputSystem.connectDevice(DeviceType.Touch, 1, TestDeviceInputSystem.MAX_POINTER_INPUTS);

        // First touch events
        testDeviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 1, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Horizontal, 0, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Vertical, 0, false);

        const downEvt1 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 0, PointerInput.LeftClick, 1, testDeviceInputSystem);
        const downPI1 = new PointerInfo(PointerEventTypes.POINTERDOWN, downEvt1 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Horizontal, 15, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Vertical, 15, false);

        const moveEvt1 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 0, PointerInput.Move, 1, testDeviceInputSystem);
        const movePI1 = new PointerInfo(PointerEventTypes.POINTERMOVE, moveEvt1 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 0, false);

        const upEvt1 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 0, PointerInput.LeftClick, 0, testDeviceInputSystem);
        const upPI1 = new PointerInfo(PointerEventTypes.POINTERUP, upEvt1 as IMouseEvent, new PickingInfo());

        // Second touch events
        testDeviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 1, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Horizontal, 127, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Vertical, 127, false);

        const downEvt2 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 1, PointerInput.LeftClick, 1, testDeviceInputSystem);
        const downPI2 = new PointerInfo(PointerEventTypes.POINTERDOWN, downEvt2 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Horizontal, 112, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Vertical, 112, false);

        const moveEvt2 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 1, PointerInput.Move, 1, testDeviceInputSystem);
        const movePI2 = new PointerInfo(PointerEventTypes.POINTERMOVE, moveEvt2 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 0, false);

        const upEvt2 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 1, PointerInput.LeftClick, 0, testDeviceInputSystem);
        const upPI2 = new PointerInfo(PointerEventTypes.POINTERUP, upEvt2 as IMouseEvent, new PickingInfo());

        // Third touch events
        testDeviceInputSystem.connectDevice(DeviceType.Touch, 2, TestDeviceInputSystem.MAX_POINTER_INPUTS);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.LeftClick, 1, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Horizontal, 64, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Vertical, 64, false);

        const downEvt3 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 2, PointerInput.LeftClick, 1, testDeviceInputSystem);
        const downPI3 = new PointerInfo(PointerEventTypes.POINTERDOWN, downEvt3 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Horizontal, 50, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Vertical, 50, false);

        const moveEvt3 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 2, PointerInput.Move, 1, testDeviceInputSystem);
        const movePI3 = new PointerInfo(PointerEventTypes.POINTERMOVE, moveEvt3 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.LeftClick, 0, false);

        const upEvt3 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 2, PointerInput.LeftClick, 0, testDeviceInputSystem);
        const upPI3 = new PointerInfo(PointerEventTypes.POINTERUP, upEvt3 as IMouseEvent, new PickingInfo());

        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Horizontal, 64, false);
        testDeviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Vertical, 64, false);

        const moveEvt4 = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, 2, PointerInput.Move, 1, testDeviceInputSystem);
        const movePI4 = new PointerInfo(PointerEventTypes.POINTERMOVE, moveEvt4 as IMouseEvent, new PickingInfo());

        // Start pinch gesture
        scene?.onPointerObservable.notifyObservers(downPI1);
        scene?.onPointerObservable.notifyObservers(downPI2);
        scene?.onPointerObservable.notifyObservers(movePI1);
        scene?.onPointerObservable.notifyObservers(movePI2);
        scene?.render();
        expect (camera!.radius).toBeGreaterThan(radius);

        radius = camera!.radius;

        // Remove any pending movement
        camera!.inertialRadiusOffset = 0;

        // Move third while first and second are still down
        // No changes should occur
        scene?.onPointerObservable.notifyObservers(downPI3);
        scene?.onPointerObservable.notifyObservers(movePI3);
        scene?.render();
        expect(camera!.radius).toEqual(radius);

        // Release first only, no radius changes should occur
        scene?.onPointerObservable.notifyObservers(upPI1);
        scene?.onPointerObservable.notifyObservers(movePI4);
        scene?.render();
        expect(camera!.radius).toEqual(radius);

        // Release second, no radius changes should occur
        scene?.onPointerObservable.notifyObservers(upPI2);
        scene?.onPointerObservable.notifyObservers(movePI3);
        scene?.onPointerObservable.notifyObservers(upPI3);
        scene?.render();
        expect(camera!.radius).toEqual(radius);

        // Once all are released, third should be able to move the camera
        scene?.onPointerObservable.notifyObservers(downPI3);
        scene?.onPointerObservable.notifyObservers(movePI3);
        scene?.onPointerObservable.notifyObservers(upPI3);
        scene?.render();

        expect(camera!.alpha).toBeGreaterThan(alpha);
        expect(camera!.beta).toBeGreaterThan(beta);
    });
});
