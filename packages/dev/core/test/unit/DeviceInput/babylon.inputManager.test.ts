/**
 * @jest-environment jsdom
 */

import { ArcRotateCamera, FreeCamera } from "core/Cameras";
import type { PickingInfo } from "core/Collisions/pickingInfo";
import { DeviceType, PointerInput } from "core/DeviceInput";
import { InternalDeviceSourceManager } from "core/DeviceInput/internalDeviceSourceManager";
import { NullEngine } from "core/Engines";
import type { Engine } from "core/Engines/engine";
import type { IPointerEvent, IUIEvent } from "core/Events";
import { PointerEventTypes } from "core/Events";
import { Vector3 } from "core/Maths/math.vector";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { ITestDeviceInputSystem } from "./testDeviceInputSystem";
import { TestDeviceInputSystem } from "./testDeviceInputSystem";
import { SpriteManager } from "core/Sprites";
import { Epsilon } from "core/Maths/math.constants";

// Add function to NullEngine to allow for getting the canvas rect properties
NullEngine.prototype.getInputElementClientRect = function (): Nullable<DOMRect> {
    const rect = {
        bottom: this.getRenderHeight(),
        height: this.getRenderHeight(),
        left: 0,
        right: this.getRenderWidth(),
        top: 0,
        width: this.getRenderWidth(),
        x: 0,
        y: 0,
        toJSON: () => {},
    };
    return rect;
};

// Required for timers (eg. setTimeout) to work
jest.useFakeTimers();
jest.mock("core/DeviceInput/webDeviceInputSystem", () => {
    return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        WebDeviceInputSystem: jest
            .fn()
            .mockImplementation(
                (
                    engine: Engine,
                    onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void,
                    onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void,
                    onInputChanged: (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => void
                ) => {
                    return new TestDeviceInputSystem(engine, onDeviceConnected, onDeviceDisconnected, onInputChanged);
                }
            ),
    };
});

describe("InputManager", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: Nullable<FreeCamera> = null;
    let deviceInputSystem: Nullable<ITestDeviceInputSystem> = null;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        engine!._deviceSourceManager = new InternalDeviceSourceManager(engine!);
        scene = new Scene(engine);
        camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl();

        deviceInputSystem = TestDeviceInputSystem.ConvertToITestDISRef(engine!._deviceSourceManager!._deviceInputSystem);
        deviceInputSystem.connectDevice(DeviceType.Mouse, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);
    });

    afterEach(() => {
        camera?.dispose();
        scene?.dispose();
        engine?.dispose();
    });

    it("callbacks can pick and fire", () => {
        let moveCt = 0;
        let moveHitCt = 0;
        let downCt = 0;
        let downHitCt = 0;
        let upCt = 0;
        let upHitCt = 0;
        let pickCt = 0;
        const downFn = (evt: IPointerEvent, pickInfo: PickingInfo) => {
            if (pickInfo.hit) {
                downHitCt++;
            }
            downCt++;
        };
        const moveFn = (evt: IPointerEvent, pickInfo: PickingInfo) => {
            if (pickInfo.hit) {
                moveHitCt++;
            }
            moveCt++;
        };
        const upFn = (evt: IPointerEvent, pickInfo: Nullable<PickingInfo>, type: PointerEventTypes) => {
            if (pickInfo?.hit) {
                upHitCt++;
            }
            upCt++;
        };
        const pickFn = () => {
            pickCt++;
        };
        const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        box.enablePointerMoveEvents = true;

        if (deviceInputSystem && scene) {
            scene.onPointerDown = downFn;
            scene.onPointerMove = moveFn;
            scene.onPointerUp = upFn;
            // Perform single move over mesh, then click
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Move away from mesh, then click
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Click down first, move, then click up
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 15, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 15, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Since the pick checks for up and down also include checking for onPointerPick, we need to check with the callback not defined
            // This is the check with the callback defined
            scene.onPointerPick = pickFn;

            // Repeat the above tests with the onPointerPick callback defined
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Test just down
            scene.onPointerUp = undefined;
            scene.onPointerMove = undefined;
            scene.onPointerPick = undefined;

            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Test just move
            scene.onPointerDown = undefined;
            scene.onPointerMove = moveFn;

            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Test just up
            scene.onPointerUp = upFn;
            scene.onPointerMove = undefined;

            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
        }

        expect(downCt).toBe(6);
        expect(upCt).toBe(6);
        expect(moveCt).toBe(6);
        expect(pickCt).toBe(1);
        // Check that picking on other callbacks is working
        expect(downHitCt).toBe(3);
        expect(upHitCt).toBe(3);
        expect(moveHitCt).toBe(3);
    });

    it("onPointerObservable can pick only when necessary", () => {
        let lazyPickCt = 0;
        let lazyPickHitCt = 0;
        const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        box.enablePointerMoveEvents = true;

        const pickSpy = jest.spyOn(scene!, "pick");

        const observer = scene?.onPointerObservable.add((eventData) => {
            const gen = eventData._generatePickInfo.bind(eventData);
            let haveNotPicked = false;
            let lazyPicked = false;
            const genFunc = () => {
                gen();
                // Check that we have not picked yet, lazy or otherwise
                if (haveNotPicked && !lazyPicked) {
                    lazyPicked = true;
                    lazyPickCt++;
                    // Check that we have pickInfo, also indirectly used to check for double lazy picking
                    if (!eventData.pickInfo) {
                        throw "Error: pickInfo should not be null";
                    }
                } else {
                    throw "Error: Tried to lazy pick twice";
                }
            };
            eventData._generatePickInfo = genFunc;

            if (!lazyPicked) {
                haveNotPicked = true;
                const pickInfo = eventData.pickInfo;

                // Check that the box we created is the one we picked
                if (pickInfo?.pickedMesh === box && lazyPicked && haveNotPicked) {
                    lazyPickHitCt++;
                }
            }
        }, PointerEventTypes.POINTERMOVE);

        if (deviceInputSystem) {
            // Perform single move over mesh, then click
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Move away from mesh, then click
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Clear the observable and try the same actions again
            scene?.onPointerObservable.remove(observer!);
            // Since the remove function uses setTimeout (with a time of 0), we need to force it to run the timer.
            jest.runOnlyPendingTimers();

            // Perform single move over mesh, then click
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Move away from mesh, then click
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
        }

        expect(lazyPickCt).toBe(2);
        expect(lazyPickHitCt).toBe(1);
        expect(pickSpy).toBeCalledTimes(6);
    });

    it("onPointerObservable returns correct PointerEventTypes", () => {
        let moveCt = 0;
        let downCt = 0;
        let upCt = 0;
        let pickCt = 0;
        let tapCt = 0;
        let dblTapCt = 0;
        const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        box.enablePointerMoveEvents = true;

        scene?.onPointerObservable.add((eventData) => {
            const type = eventData.type;

            switch (type) {
                case PointerEventTypes.POINTERMOVE:
                    moveCt++;
                    break;
                case PointerEventTypes.POINTERDOWN:
                    downCt++;
                    break;
                case PointerEventTypes.POINTERUP:
                    upCt++;
                    break;
                case PointerEventTypes.POINTERPICK:
                    pickCt++;
                    break;
                case PointerEventTypes.POINTERTAP:
                    tapCt++;
                    break;
                case PointerEventTypes.POINTERDOUBLETAP:
                    dblTapCt++;
                    break;
            }
        });

        if (deviceInputSystem) {
            // Perform single move over mesh, then double-click
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Move away from mesh, then double-click
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Move to Mesh, press down LMB, move away and back to exact spot, release LMB
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 129 + Scene.DragMovementThreshold, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 129 + Scene.DragMovementThreshold, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Next, we test that the skipNextObservers flag is working correctly
            let testObserver = scene?.onPrePointerObservable.add((eventData) => {
                eventData.skipOnPointerObservable = true;
            }, PointerEventTypes.POINTERDOWN);

            // Expect nothing because we skipped the DOWN and no capture was made
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            scene?.onPrePointerObservable.remove(testObserver!);

            testObserver = scene?.onPrePointerObservable.add((eventData) => {
                eventData.skipOnPointerObservable = true;
            }, PointerEventTypes.POINTERMOVE);

            // Expect a DOWN and UP
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            scene?.onPrePointerObservable.remove(testObserver!);

            testObserver = scene?.onPrePointerObservable.add((eventData) => {
                eventData.skipOnPointerObservable = true;
            }, PointerEventTypes.POINTERTAP);

            // Expect 2 DOWNs, 2 UPs, and a DOUBLETAP
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            scene?.onPrePointerObservable.remove(testObserver!);

            testObserver = scene?.onPrePointerObservable.add((eventData) => {
                eventData.skipOnPointerObservable = true;
            }, PointerEventTypes.POINTERDOUBLETAP);

            // Expect 2 DOWNs, 2 UPs, and a TAP
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            scene?.onPrePointerObservable.remove(testObserver!);

            testObserver = scene?.onPrePointerObservable.add((eventData) => {
                eventData.skipOnPointerObservable = true;
            }, PointerEventTypes.POINTERUP);

            // Expect 2 DOWNs
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
        }

        expect(downCt).toBe(12);
        expect(upCt).toBe(10);
        expect(moveCt).toBe(5);
        expect(pickCt).toBe(1);
        expect(tapCt).toBe(3);
        expect(dblTapCt).toBe(3);
    });

    it("Does not fire POINTERTAP events during multi-touch gesture", () => {
        let tapCt = 0;

        scene?.onPointerObservable.add(() => {
            tapCt++;
        }, PointerEventTypes.POINTERTAP);

        if (deviceInputSystem) {
            // Connect touches
            deviceInputSystem.connectDevice(DeviceType.Touch, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);
            deviceInputSystem.connectDevice(DeviceType.Touch, 1, TestDeviceInputSystem.MAX_POINTER_INPUTS);
            // Perform Single Tap
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 0);

            // Perform Multi-Touch Gesture (2 fingers; FIFO release order)
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 0);

            // Perform Single Tap
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 0);

            // Perform Multi-Touch Gesture (2 fingers; LIFO release order)
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 0);

            // Perform Single Tap
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 0);

            // Perform Single Touch Move (no tap)
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 0);

            // Perform Pinch Gesture
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Horizontal, 63, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Vertical, 63, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Horizontal, 127, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Vertical, 127, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 0);
        }

        expect(tapCt).toBe(3);
    });

    it("Doesn't let TAPs pass through utility layer", () => {
        let tapCt = 0;

        // Move camera to overhead so that sphere is guaranteed to be over ground
        // If there's a pass thru issue, any click will also hit the ground
        camera!.position = new Vector3(0, 10, 0);
        camera!.setTarget(Vector3.Zero());

        if (scene) {
            const utilityLayer = new UtilityLayerRenderer(scene);
            const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
            const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, utilityLayer.utilityLayerScene);
            sphere.position.y = 1;

            scene.onPointerObservable.add((eventData) => {
                if (eventData.pickInfo?.hit && eventData.pickInfo.pickedMesh === ground) {
                    tapCt++;
                }
            }, PointerEventTypes.POINTERTAP);

            if (deviceInputSystem) {
                deviceInputSystem.connectDevice(DeviceType.Mouse, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);

                // Move mouse over sphere and tap, expect no increment of tapCt
                deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 64, false);
                deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 64, false);
                deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
                deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

                // Move mouse over ground and tap, should increment tapCt once
                deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 50, false);
                deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 50, false);
                deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
                deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            }
        }
        expect(tapCt).toBe(1);
    });

    // Flaky test, disabling until we can figure out why
    /*it("Doesn't fire onPointerOberservable for POINTERTAP when ExclusiveDoubleClickMode is enabled", async () => {
        let tapCt = 0;
        let dblTapCt = 0;
        const t = InputManager.DoubleClickDelay + 300; // Time to wait for all inputs to resolve

        scene!.onPointerObservable.add(() => {
            tapCt++;
        }, PointerEventTypes.POINTERTAP);

        scene!.onPointerObservable.add(() => {
            dblTapCt++;
        }, PointerEventTypes.POINTERDOUBLETAP);

        if (deviceInputSystem) {
            // Expect a single tap and double tap
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Expect only a double tap
            InputManager.ExclusiveDoubleClickMode = true;
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Because the input manager uses the system clock, we need to use real timers
            // and wait for the double click delay to pass so that we can work with a clean slate
            jest.useRealTimers();
            await new Promise((resolve) => setTimeout(resolve, t));

            // Expect a single tap only
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Wait for the double click delay to pass again
            await new Promise((resolve) => setTimeout(resolve, t));

            // Expect two single taps
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.RightClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.RightClick, 0);

            await new Promise((resolve) => setTimeout(resolve, t));

            // Double click, immediately followed by a single click, should still fire a double click and a single click
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.RightClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.RightClick, 0);

            await new Promise((resolve) => setTimeout(resolve, t));

            // Single click, immediately followed by a double click, should still fire a single click and a double click
            // With no additional clicks
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.RightClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.RightClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            await new Promise((resolve) => setTimeout(resolve, t));

            // Three single clicks alternating between left and right
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.RightClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.RightClick, 0);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            await new Promise((resolve) => setTimeout(resolve, t));

            // Reset to fake timers
            jest.useFakeTimers();
        }
        // Since this is static, we should reset it to false for other tests
        InputManager.ExclusiveDoubleClickMode = false;

        expect(tapCt).toBe(9);
        expect(dblTapCt).toBe(4);
    });*/

    it("can fire onViewMatrixObservable on camera.update", () => {
        let viewMatrixChangedCt = 0;

        if (deviceInputSystem && camera && scene) {
            // Setting inertia to 0 so that all movements are immediate with no carry over
            camera.inertia = 0;
            camera.onViewMatrixChangedObservable.add(() => {
                viewMatrixChangedCt++;
            });

            // Need to set constant animation delta time to true because we're not using the default render loop
            // which will result in an unusable delta time
            scene.useConstantAnimationDeltaTime = true;
            // Perform basic mouse move (should trigger observable because of down pick)
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Perform basic mouse move (shouldn't trigger observable because neither update() or render() were called)
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 127, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 127, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Perform mouse move and then run render() (should trigger observable)
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            scene.render();

            // Perform basic mouse move (shouldn't trigger observable because neither update() or render() were called)
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 127, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 127, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Perform mouse move and then run update() (should trigger observable)
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 96, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 96, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            camera.update();

            // Perform basic mouse move and then call update() and render() (should trigger observable ONLY ONCE)
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 127, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 127, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            // This should trigger the observable
            camera.update();
            // This should NOT trigger the observable
            scene.render();
        }

        expect(viewMatrixChangedCt).toBe(4);
    });

    it("takes the same time to move ArcRotateCamera with different frame rates", () => {
        let frame30FPS = 0;
        let finalRadius30FPS = 0;
        let finalAlpha30FPS = 0;
        let finalBeta30FPS = 0;
        let frame60FPS = 0;
        let finalRadius60FPS = 0;
        let finalAlpha60FPS = 0;
        let finalBeta60FPS = 0;
        let frame120FPS = 0;
        let finalRadius120FPS = 0;
        let finalAlpha120FPS = 0;
        let finalBeta120FPS = 0;

        if (deviceInputSystem && camera && scene) {
            // We're not using the FreeCamera to let's dispose of it
            camera?.dispose();
            // Instead, let's use an ArcRotateCamera
            const arcRotateCamera = new ArcRotateCamera("arcRotateCamera", 0, Math.PI / 2, 10, Vector3.Zero(), scene);
            // Need to set constant animation delta time to true because we're not using the default render loop
            // which will result in an unusable delta time
            scene.useConstantAnimationDeltaTime = true;

            // Test at 60 FPS
            scene.constantAnimationDeltaTime = 16;
            // Radius
            arcRotateCamera.alpha = 0;
            arcRotateCamera.beta = Math.PI / 2;
            arcRotateCamera.radius = 10;
            arcRotateCamera.inertialRadiusOffset = 1;
            while (arcRotateCamera.inertialRadiusOffset != 0) {
                frame60FPS++;
                scene.render();
            }
            finalRadius60FPS = arcRotateCamera.radius;
            // Alpha
            arcRotateCamera.alpha = 0;
            arcRotateCamera.inertialAlphaOffset = 1;
            while (arcRotateCamera.inertialAlphaOffset != 0) {
                scene.render();
            }
            finalAlpha60FPS = arcRotateCamera.alpha;
            // Beta
            arcRotateCamera.beta = Math.PI / 2;
            arcRotateCamera.inertialBetaOffset = 1;
            while (arcRotateCamera.inertialBetaOffset != 0) {
                scene.render();
            }
            finalBeta60FPS = arcRotateCamera.beta;

            // Test at 30 FPS
            scene.constantAnimationDeltaTime = 32;
            // Radius
            arcRotateCamera.alpha = 0;
            arcRotateCamera.beta = Math.PI / 2;
            arcRotateCamera.radius = 10;
            arcRotateCamera.inertialRadiusOffset = 1;
            while (arcRotateCamera.inertialRadiusOffset != 0) {
                frame30FPS++;
                scene.render();
            }
            finalRadius30FPS = arcRotateCamera.radius;
            // Alpha
            arcRotateCamera.alpha = 0;
            arcRotateCamera.inertialAlphaOffset = 1;
            while (arcRotateCamera.inertialAlphaOffset != 0) {
                scene.render();
            }
            finalAlpha30FPS = arcRotateCamera.alpha;
            // Beta
            arcRotateCamera.beta = Math.PI / 2;
            arcRotateCamera.inertialBetaOffset = 1;
            while (arcRotateCamera.inertialBetaOffset != 0) {
                scene.render();
            }
            finalBeta30FPS = arcRotateCamera.beta;

            // Test at 120 FPS
            scene.constantAnimationDeltaTime = 8;
            // Radius
            arcRotateCamera.alpha = 0;
            arcRotateCamera.beta = Math.PI / 2;
            arcRotateCamera.radius = 10;
            arcRotateCamera.inertialRadiusOffset = 1;
            while (arcRotateCamera.inertialRadiusOffset != 0) {
                frame120FPS++;
                scene.render();
            }
            finalRadius120FPS = arcRotateCamera.radius;
            // Alpha
            arcRotateCamera.alpha = 0;
            arcRotateCamera.inertialAlphaOffset = 1;
            while (arcRotateCamera.inertialAlphaOffset != 0) {
                scene.render();
            }
            finalAlpha120FPS = arcRotateCamera.alpha;
            // Beta
            arcRotateCamera.beta = Math.PI / 2;
            arcRotateCamera.inertialBetaOffset = 1;
            while (arcRotateCamera.inertialBetaOffset != 0) {
                scene.render();
            }
            finalBeta120FPS = arcRotateCamera.beta;
        }

        // The number of frames should be the within +/- 1 frame of each other
        const diffFrames30FPS = Math.abs(frame30FPS - frame60FPS * 0.5);
        const diffFrames120FPS = Math.abs(frame120FPS - frame60FPS * 2);
        expect(diffFrames30FPS).toBeLessThanOrEqual(1);
        expect(diffFrames120FPS).toBeLessThanOrEqual(1);

        // The final radius should be within camera.speed (Default: 2) * Epsilon of each other
        const radiusMarginOfError = 2 * Epsilon;
        const diffRadius30FPS = Math.abs(finalRadius30FPS - finalRadius60FPS);
        const diffRadius120FPS = Math.abs(finalRadius120FPS - finalRadius60FPS);
        expect(diffRadius30FPS).toBeLessThanOrEqual(radiusMarginOfError);
        expect(diffRadius120FPS).toBeLessThanOrEqual(radiusMarginOfError);

        // For alpha and beta, the final values should be within Epsilon of each other
        const angleMarginOfError = Epsilon;
        const diffAlpha30FPS = Math.abs(finalAlpha30FPS - finalAlpha60FPS);
        const diffAlpha120FPS = Math.abs(finalAlpha120FPS - finalAlpha60FPS);
        expect(diffAlpha30FPS).toBeLessThanOrEqual(angleMarginOfError);
        expect(diffAlpha120FPS).toBeLessThanOrEqual(angleMarginOfError);

        const diffBeta30FPS = Math.abs(finalBeta30FPS - finalBeta60FPS);
        const diffBeta120FPS = Math.abs(finalBeta120FPS - finalBeta60FPS);
        expect(diffBeta30FPS).toBeLessThanOrEqual(angleMarginOfError);
        expect(diffBeta120FPS).toBeLessThanOrEqual(angleMarginOfError);
    });

    it("takes the same time to move FreeCamera with different frame rates", () => {
        let frame30FPS = 0;
        const finalPosition30FPS: Vector3 = Vector3.Zero();
        const finalRotation30FPS: Vector3 = Vector3.Zero();
        let frame60FPS = 0;
        const finalPosition60FPS: Vector3 = Vector3.Zero();
        const finalRotation60FPS: Vector3 = Vector3.Zero();
        let frame120FPS = 0;
        const finalPosition120FPS: Vector3 = Vector3.Zero();
        const finalRotation120FPS: Vector3 = Vector3.Zero();

        if (deviceInputSystem && camera && scene) {
            // Need to set constant animation delta time to true because we're not using the default render loop
            // which will result in an unusable delta time
            scene.useConstantAnimationDeltaTime = true;

            /** Check cameraDirection */
            // Test at 60 FPS
            scene.constantAnimationDeltaTime = 16;
            camera.position.copyFromFloats(0, 0, 0);
            camera.cameraDirection.x = 10;
            camera.cameraDirection.y = 10;
            camera.cameraDirection.z = 10;
            while (!camera.cameraDirection.equalsToFloats(0, 0, 0)) {
                frame60FPS++;
                scene.render();
            }
            finalPosition60FPS.copyFrom(camera.position);

            // Test at 30 FPS
            scene.constantAnimationDeltaTime = 32;
            camera.position.copyFromFloats(0, 0, 0);
            camera.cameraDirection.x = 10;
            camera.cameraDirection.y = 10;
            camera.cameraDirection.z = 10;
            while (!camera.cameraDirection.equalsToFloats(0, 0, 0)) {
                frame30FPS++;
                scene.render();
            }
            finalPosition30FPS.copyFrom(camera.position);

            // Test at 120 FPS
            scene.constantAnimationDeltaTime = 8;
            camera.position.copyFromFloats(0, 0, 0);
            camera.cameraDirection.x = 10;
            camera.cameraDirection.y = 10;
            camera.cameraDirection.z = 10;
            while (!camera.cameraDirection.equalsToFloats(0, 0, 0)) {
                frame120FPS++;
                scene.render();
            }
            finalPosition120FPS.copyFrom(camera.position);

            // Reset position for next set of tests
            camera.position.copyFromFloats(0, 0, 0);

            /** Check cameraRotation */
            // Test at 60 FPS
            scene.constantAnimationDeltaTime = 16;
            camera.rotation.copyFromFloats(0, 0, 0);
            camera.cameraRotation.x = 1;
            camera.cameraRotation.y = 1;
            while (camera.cameraRotation.x != 0 && camera.cameraRotation.y != 0) {
                scene.render();
            }
            finalRotation60FPS.copyFrom(camera.rotation);

            // Test at 30 FPS
            scene.constantAnimationDeltaTime = 32;
            camera.rotation.copyFromFloats(0, 0, 0);
            camera.cameraRotation.x = 1;
            camera.cameraRotation.y = 1;
            while (camera.cameraRotation.x != 0 && camera.cameraRotation.y != 0) {
                scene.render();
            }
            finalRotation30FPS.copyFrom(camera.rotation);

            // Test at 120 FPS
            scene.constantAnimationDeltaTime = 8;
            camera.rotation.copyFromFloats(0, 0, 0);
            camera.cameraRotation.x = 1;
            camera.cameraRotation.y = 1;
            while (camera.cameraRotation.x != 0 && camera.cameraRotation.y != 0) {
                scene.render();
            }
            finalRotation120FPS.copyFrom(camera.rotation);
        }

        // The number of frames should be the within +/- 1 frame of each other
        const diff30FPS = Math.abs(frame30FPS - frame60FPS * 0.5);
        const diff120FPS = Math.abs(frame120FPS - frame60FPS * 2);
        expect(diff30FPS).toBeLessThanOrEqual(1);
        expect(diff120FPS).toBeLessThanOrEqual(1);

        // Since the cutoff for all inertial values is equal to speed (default: 2) * Epsilon, we can use that to
        // determine the margin of error for our tests
        const marginOfError = (camera?.speed ?? 2) * Epsilon;
        const distanceMatch30FPS = finalPosition30FPS.equalsWithEpsilon(finalPosition60FPS, marginOfError);
        const distanceMatch120FPS = finalPosition120FPS.equalsWithEpsilon(finalPosition60FPS, marginOfError);
        const rotationMatch30FPS = finalRotation30FPS.equalsWithEpsilon(finalRotation60FPS, marginOfError);
        const rotationMatch120FPS = finalRotation120FPS.equalsWithEpsilon(finalRotation60FPS, marginOfError);
        expect(distanceMatch30FPS).toBe(true);
        expect(distanceMatch120FPS).toBe(true);
        expect(rotationMatch30FPS).toBe(true);
        expect(rotationMatch120FPS).toBe(true);
    });

    it("can fire onProjectionMatrixObservable on camera.update", () => {
        let projectionMatrixChangedCt = 0;

        if (deviceInputSystem && camera && scene) {
            camera.onProjectionMatrixChangedObservable.add(() => {
                projectionMatrixChangedCt++;
            });

            // Change FOV and then run render() (should trigger observable)
            camera.fov = 0.8;
            scene.render();

            // Change FOV and then run update() (should trigger observable)
            camera.fov = 0.7;
            camera.update();

            // Change FOV and then run update() then render() (should trigger observable only once)
            camera.fov = 0.6;
            camera.update();
            // This should NOT trigger the observable
            scene.render();
        }

        expect(projectionMatrixChangedCt).toBe(3);
    });

    it("stops movement when pointerlock is released", () => {
        // Create a canvas that we can use to test our isPointerLock logic
        const emptyCanvas = document.createElement("canvas");
        let passedTest = false;

        // Since the NullEngine can't actually use the renderingCanvas, we have to manually add it
        Object.defineProperty(engine, "_renderingCanvas", {
            value: emptyCanvas,
            writable: true,
        });

        expect(engine?.isPointerLock).toBe(false);

        if (deviceInputSystem && scene && engine) {
            const arcCamera = new ArcRotateCamera("camera", 0, 0, 0, Vector3.Zero(), scene);
            scene.activeCamera = arcCamera;
            arcCamera.attachControl();

            // Set initial point
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
            arcCamera.inertialAlphaOffset = 0;
            arcCamera.inertialBetaOffset = 0;

            // Set pointerlockElement to our canvas element, this will enable pointerlock
            Object.defineProperty(document, "pointerLockElement", {
                value: emptyCanvas,
                writable: true,
            });

            // Since the NullEngine is unable to assign and call this we'll just set it manually
            // This will allow it to be called by _verifyPointerLock (used by InputManager)
            Object.defineProperty(engine, "_onPointerLockChange", {
                value: () => {
                    engine!.isPointerLock = document.pointerLockElement === emptyCanvas;
                },
                writable: true,
            });

            // Manually set isPointerLock to true
            engine.isPointerLock = true;

            // Move left a bit and see if there's a change in the alpha offset
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, 10, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            // Check that the offset has changed
            const testOffset = arcCamera.inertialAlphaOffset;
            passedTest = testOffset !== 0;

            // Remove the element to disable pointerlock
            // As a side note, disabling pointerlock will clear the pointerlockElement
            // so this should resolve isPointerLock to false (which is why we're not explicitly setting it to false)
            Object.defineProperty(document, "pointerLockElement", {
                value: undefined,
                writable: true,
            });

            // Next, we're attempting to move the camera with no pointerLockElement
            // The check for isPointerLock in the InputManager's _onPointerMove function should
            // force isPointerLock to false, which should prevent the camera from moving.
            // There should be no change.
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, 10, -640, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);

            // If we passed the previous test and there was no change, this should pass too.
            passedTest = passedTest && !engine.isPointerLock && arcCamera.inertialAlphaOffset === testOffset;

            // Get rid of the ArcRotateCamera
            arcCamera.detachControl();
            arcCamera.dispose();
        }

        expect(passedTest).toBe(true);
    });

    it("doesn't use lazy picking with SpriteManager", () => {
        // This specific scenario is to test if the picking is working properly when there is a sprite manager
        // and the constantlyUpdateMeshUnderPointer flag is set to true
        expect.assertions(2);
        let pickedTestMesh = null;

        if (deviceInputSystem && scene && engine) {
            // Create a SpriteManager to test if it affects the picking behavior
            const spriteManager = new SpriteManager("name", "", 1, 1, scene);
            MeshBuilder.CreateBox("box", { size: 5 }, scene);

            // Set flag to constantly update the mesh that's under the pointer (not use lazy picking)
            scene.constantlyUpdateMeshUnderPointer = true;
            scene.onPointerObservable.add((pointerInfo) => {
                const generateSpy = jest.spyOn(pointerInfo, "_generatePickInfo");
                if (pointerInfo.pickInfo?.hit) {
                    pickedTestMesh = pointerInfo.pickInfo.pickedMesh;
                }
                // We expect this to not be called at all as the picking should already be done by this point
                expect(generateSpy).toBeCalledTimes(0);
            });

            // Set initial point
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
        }

        expect(pickedTestMesh).not.toBe(null);
    });

    it("can reset touch inputs on detachControl", () => {
        let deltaX1 = 0;
        let deltaY1 = 0;
        let deltaX2 = 0;
        let deltaY2 = 0;

        if (deviceInputSystem && camera && scene) {
            camera.attachControl();

            // Connect the first touch and move down and right
            deviceInputSystem.connectDevice(DeviceType.Touch, 1, TestDeviceInputSystem.MAX_POINTER_INPUTS);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.Move, 1);

            // Both should be positive values based on movement
            deltaX1 = camera.cameraRotation.x;
            deltaY1 = camera.cameraRotation.y;

            // Detach and reattach the camera
            // Note: Detaching the controls will zero out the camera rotation
            camera.detachControl();

            // We need to trigger the up after the controls are detached
            // This enables us to check if the inputs are reset properly on detach
            // because the up code normally will reset things when controls are attached
            deviceInputSystem.changeInput(DeviceType.Touch, 1, PointerInput.LeftClick, 0);

            camera.attachControl();

            // Connect the second touch and move down and right
            deviceInputSystem.connectDevice(DeviceType.Touch, 2, TestDeviceInputSystem.MAX_POINTER_INPUTS);
            deviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Horizontal, 0, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Vertical, 0, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Horizontal, 64, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Vertical, 64, false);
            deviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Touch, 2, PointerInput.LeftClick, 0);

            // Both should be positive values based on movement
            deltaX2 = camera.cameraRotation.x;
            deltaY2 = camera.cameraRotation.y;
        }

        expect(deltaX1).toBeGreaterThan(0);
        expect(deltaY1).toBeGreaterThan(0);
        expect(deltaX2).toBeGreaterThan(0);
        expect(deltaY2).toBeGreaterThan(0);
    });
});
