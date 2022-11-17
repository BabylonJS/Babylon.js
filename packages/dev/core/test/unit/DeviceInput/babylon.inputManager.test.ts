/**
 * @jest-environment jsdom
 */

import { FreeCamera } from "core/Cameras";
import { DeviceType, PointerInput } from "core/DeviceInput";
import { InternalDeviceSourceManager } from "core/DeviceInput/internalDeviceSourceManager";
import { NullEngine } from "core/Engines";
import type { Engine } from "core/Engines/engine";
import type { IUIEvent } from "core/Events";
import { PointerEventTypes } from "core/Events";
import { Vector3 } from "core/Maths/math.vector";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { ITestDeviceInputSystem } from "./testDeviceInputSystem";
import { TestDeviceInputSystem } from "./testDeviceInputSystem";

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
        const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        box.enablePointerMoveEvents = true;

        scene!.onPointerDown = (evt, pickInfo) => {
            if (pickInfo.hit) {
                downHitCt++;
            }
            downCt++;
        };

        scene!.onPointerMove = (evt, pickInfo) => {
            if (pickInfo.hit) {
                moveHitCt++;
            }
            moveCt++;
        };

        scene!.onPointerUp = (evt, pickInfo) => {
            if (pickInfo?.hit) {
                upHitCt++;
            }
            upCt++;
        };

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

            // Click down first, move, then click up
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 15, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 15, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);

            // Since the pick checks for up and down also include checking for onPointerPick, we need to check with the callback not defined
            // This is the check with the callback defined
            scene!.onPointerPick = () => {
                pickCt++;
            };

            // Repeat the above tests with the onPointerPick callback defined
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Horizontal, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Vertical, 128, false);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.Move, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
            deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 0);
        }

        expect(downCt).toBe(4);
        expect(upCt).toBe(4);
        expect(moveCt).toBe(4);
        expect(pickCt).toBe(1);
        // Check that picking on other callbacks is working
        expect(downHitCt).toBe(2);
        expect(upHitCt).toBe(2);
        expect(moveHitCt).toBe(2);
    });

    it("onPointerObservable can pick only when necessary", () => {
        let lazyPickCt = 0;
        let lazyPickHitCt = 0;
        const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        box.enablePointerMoveEvents = true;

        const pickSpy = jest.spyOn(scene!, "pick");

        scene?.onPointerObservable.add((eventData) => {
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
            scene?.onPointerObservable.clear();

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
        }

        expect(downCt).toBe(5);
        expect(upCt).toBe(5);
        expect(moveCt).toBe(5);
        expect(pickCt).toBe(1);
        expect(tapCt).toBe(2);
        expect(dblTapCt).toBe(2);
    });
});
