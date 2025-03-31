import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { PickingInfo } from "core/Collisions";
import { DeviceEventFactory } from "core/DeviceInput/eventFactory";
import { DeviceType, PointerInput } from "core/DeviceInput/InputDevices/deviceEnums";
import { NullEngine } from "core/Engines/nullEngine";
import { PointerEventTypes, PointerInfo } from "core/Events";
import type { IMouseEvent } from "core/Events/deviceInputEvents";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { WithinEpsilon } from "core/Maths/math.scalar.functions";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { TestDeviceInputSystem } from "../DeviceInput/testDeviceInputSystem";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Frustum } from "core/Maths";
import { StandardMaterial } from "core/Materials";

function waitForCondition(condition: () => boolean, timeout: number = 5000, interval: number = 50): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkCondition = () => {
            if (condition()) {
                resolve();
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error(`Timeout waiting for condition to become true: ${condition}`));
            } else {
                setTimeout(checkCondition, interval);
            }
        };

        checkCondition();
    });
}

describe("ArcRotateCamera", () => {
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
        camera.restoreStateInterpolationFactor = 0.01;
    });

    afterEach(() => {
        camera?.dispose();
        scene?.dispose();
        engine?.dispose();
    });

    describe("MouseInput", () => {
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
            expect(camera!.radius).toBeGreaterThan(radius);

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

        it("correctly zooms when zoomOn is called", () => {
            let outOfBoundsPoints = 0;
            let inBoundsPoints = 0;

            if (camera && scene && StandardMaterial) {
                // Create box to check zoomOn against
                const box = MeshBuilder.CreateBox("box", { height: 1, width: 2, depth: 1 }, scene);
                // Set angles such that the box's mix/max points are not technically
                // the farthest points in screen/camera space
                camera.alpha = Math.PI / 3;
                camera.beta = Math.PI / 2.5;
                camera.radius = 0.01;
                box.position = new Vector3(0, 0.5, 0);
                scene.render();

                // Get frustum planes from camera transformation matrix
                let transformMatrix = camera.getTransformationMatrix();
                let frustumPlanes = Frustum.GetPlanes(transformMatrix);

                // Get all bounding box points and check if they are in the frustum
                // both before and after zoomOn
                const pointsToCheck = box.getBoundingInfo().boundingBox.vectorsWorld;

                // Before zoomOn
                for (const point of pointsToCheck) {
                    if (!Frustum.IsPointInFrustum(point, frustumPlanes)) {
                        outOfBoundsPoints++;
                    }
                }

                scene.render();
                camera.zoomOn([box]);
                scene.render();

                // Update frustum planes and transformation matrix
                transformMatrix = camera.getTransformationMatrix();
                frustumPlanes = Frustum.GetPlanes(transformMatrix);

                // After zoomOn
                for (const point of pointsToCheck) {
                    if (Frustum.IsPointInFrustum(point, frustumPlanes)) {
                        inBoundsPoints++;
                    }
                }
            }

            expect(outOfBoundsPoints).toEqual(8);
            expect(inBoundsPoints).toEqual(8);
        });
    });

    describe("Interpolation", () => {
        it("arrives at goal", async () => {
            engine!.runRenderLoop(() => {
                scene!.render();
            });

            camera!.interpolateTo(1, 2, 3, new Vector3(4, 5, 6), new Vector2(7, 8), 0.01);
            await waitForCondition(() => !camera!.isInterpolating);

            expect(WithinEpsilon(camera!.alpha, 1)).toBe(true);
            expect(WithinEpsilon(camera!.beta, 2)).toBe(true);
            expect(WithinEpsilon(camera!.radius, 3)).toBe(true);
            expect(WithinEpsilon(camera!.target.x, 4)).toBe(true);
            expect(WithinEpsilon(camera!.target.y, 5)).toBe(true);
            expect(WithinEpsilon(camera!.target.z, 6)).toBe(true);
            expect(WithinEpsilon(camera!.targetScreenOffset.x, 7)).toBe(true);
            expect(WithinEpsilon(camera!.targetScreenOffset.y, 8)).toBe(true);
        });

        it("undefined uses current value", async () => {
            engine!.runRenderLoop(() => {
                scene!.render();
            });

            camera!.alpha = 1;
            camera!.interpolateTo(2);
            camera!.interpolateTo(undefined, 2);

            await waitForCondition(() => !camera!.isInterpolating);

            expect(WithinEpsilon(camera!.alpha, 1)).toBe(true);
            expect(WithinEpsilon(camera!.beta, 2)).toBe(true);
        });

        it("NaN uses current goal", async () => {
            engine!.runRenderLoop(() => {
                scene!.render();
            });

            camera!.alpha = 1;
            camera!.interpolateTo(2);
            camera!.interpolateTo(NaN, 2);

            await waitForCondition(() => !camera!.isInterpolating);

            expect(WithinEpsilon(camera!.alpha, 2)).toBe(true);
            expect(WithinEpsilon(camera!.beta, 2)).toBe(true);
        });
    });
});
