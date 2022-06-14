import { NullEngine } from "core/Engines";
import { DeviceType, DeviceSourceManager, DeviceSource, PointerInput } from "core/DeviceInput";
import { WebDeviceInputSystem } from "core/DeviceInput/InputDevices/webDeviceInputSystem";
import { IPointerEvent, IUIEvent, IWheelEvent, PointerEventTypes } from "core/Events";
import { Observable } from "core/Misc";
import { Nullable } from "core/types";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras";
import { Vector3 } from "core/Maths/math";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { AbstractMesh } from "core/Meshes/abstractMesh";

class TestEventTarget {
    private _events: Map<string, Array<(event: any) => void>> = new Map();

    public addEventListener(type: string, listener: (event: any) => void): void {
        if (!this._events.has(type)) {
            this._events.set(type, []);
        }
        const evtType = this._events.get(type);
        evtType!.push(listener);
        this._events.set(type, evtType!);
    }

    public dispatchEvent(event: any): void {
        const evtType = event.type;
        const callbacks = this._events.get(evtType);

        if (callbacks) {
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i](event);
            }
        }
    }

    public removeEventListener(type: string, listener: (event: any) => void): void {
        let callbacks = this._events.get(type);
        const callbackIdx = callbacks
            ? callbacks.findIndex((value) => {
                  return value === listener;
              })
            : -1;

        if (callbacks && callbackIdx !== -1) {
            callbacks = callbacks.splice(callbackIdx, 1);
            this._events.set(type, callbacks);
        }
    }

    public dispose() {
        this._events.clear();
    }
}

class TestDocument extends TestEventTarget {
    private _elements: Array<TestEventTarget>;

    constructor() {
        super();
        this._elements = new Array();
    }

    public createElement(tagName: string) {
        const element: any = new TestEventTarget();
        // This is only used for detecting which version of wheel; Can we remove this from the WebDIS?
        if (tagName == "div") {
            element.onwheel = "wheel";
        }
        // Used as part of Tools.GetPointerPrefix() to determine if which wheel event to use
        if (tagName == "window") {
            element.PointerEvent = true;
        }

        if (tagName == "canvas") {
            element.focus = () => {};
            element.width = 512;
            element.height = 256;
        }

        this._elements.push(element);
        return element;
    }

    public dispose() {
        for (const element of this._elements) {
            element.dispose();
        }
    }
}

describe("DeviceSource", () => {
    let doc = new TestDocument();
    let win = doc.createElement("window");
    let canvas = doc.createElement("canvas");
    let engine = new NullEngine();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let onDeviceConnected = (deviceType: DeviceType, deviceSlot: number) => {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => {};

    let wdis: WebDeviceInputSystem;

    beforeAll(function () {
        NullEngine.prototype.getInputElement = () => {
            return canvas;
        };

        Object.defineProperty(globalThis, "document", {
            configurable: true,
            value: doc,
        });

        Object.defineProperty(globalThis, "window", {
            configurable: true,
            value: win,
        });
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: {
                maxTouchPoints: 10,
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36", // Treat as Chrome
                getGamePads: () => {
                    return [];
                },
            },
        });
        Object.defineProperty(globalThis, "matchMedia", {
            configurable: true,
            value: () => {
                return {
                    matches: false,
                    addListener: () => {},
                    removeListener: () => {},
                };
            },
        });
    });

    beforeEach(function () {
        doc = new TestDocument();
        win = doc.createElement("window");
        canvas = doc.createElement("canvas");
        engine = new NullEngine();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onDeviceConnected = (deviceType: DeviceType, deviceSlot: number) => {};
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => {};
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => {};
    });

    afterEach(function () {
        wdis.dispose();
        doc.dispose();
        engine.dispose();
    });

    describe("DeviceSource object", () => {
        it("should exist", () => {
            wdis = new WebDeviceInputSystem(engine, onDeviceConnected, onDeviceDisconnected, onInputChanged);
            const mouseSource = new DeviceSource(wdis, DeviceType.Mouse, 0);
            expect(mouseSource).not.toBeNull();
            expect(mouseSource.deviceType).toBe(DeviceType.Mouse);
            expect(mouseSource.deviceSlot).toBe(0);
            expect(mouseSource.onInputChangedObservable).not.toBeUndefined();
        });
        it("can poll with getInput", () => {
            wdis = new WebDeviceInputSystem(engine, onDeviceConnected, onDeviceDisconnected, onInputChanged);
            const mouseSource = new DeviceSource(wdis, DeviceType.Mouse, 0);
            const evt = { pointerId: 1, type: "pointerdown", pointerType: "mouse", button: 0, clientX: 1, clientY: 1 };
            canvas.dispatchEvent(evt);
            const leftClick = mouseSource.getInput(PointerInput.LeftClick);
            expect(leftClick).toBe(1);
        });
        it("can use onInputChangedObservable", () => {
            // NOTES: Do we want to use the event factory to test this instead?
            let obsEvent: Nullable<IWheelEvent | IPointerEvent> = null;
            let callbackEvent: Nullable<IUIEvent> = null;
            // This will act as the DeviceSourceManagers observable
            const testObservable: Observable<IUIEvent> = new Observable();

            // Set DeviceInputSystem's callback
            onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => {
                callbackEvent = eventData;
                expect(callbackEvent).not.toBeNull();
                testObservable.notifyObservers(eventData);
            };
            wdis = new WebDeviceInputSystem(engine, onDeviceConnected, onDeviceDisconnected, onInputChanged);

            // Create DeviceSource and add to its observable
            const mouseSource = new DeviceSource(wdis, DeviceType.Mouse, 0);
            mouseSource.onInputChangedObservable.add((eventData) => {
                obsEvent = eventData;
                expect(obsEvent).not.toBeNull();
            });

            testObservable.add((eventData) => {
                mouseSource.onInputChangedObservable.notifyObservers(eventData as IPointerEvent);
            });

            const evt = { pointerId: 1, type: "pointerdown", pointerType: "mouse", button: 0, clientX: 1, clientY: 1 };
            canvas.dispatchEvent(evt);
            expect(mouseSource.onInputChangedObservable.hasObservers()).toBe(true);
            expect(obsEvent).toEqual(callbackEvent);
        });
    });
});

describe("DeviceSourceManager", () => {
    let doc = new TestDocument();
    let win = doc.createElement("window");
    let canvas = doc.createElement("canvas");
    let engine = new NullEngine();
    let dsm: DeviceSourceManager;

    beforeAll(function () {
        NullEngine.prototype.getInputElement = () => {
            return canvas;
        };

        Object.defineProperty(globalThis, "document", {
            configurable: true,
            value: doc,
        });

        Object.defineProperty(globalThis, "window", {
            configurable: true,
            value: win,
        });
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: {
                maxTouchPoints: 10,
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36",
                getGamePads: () => {
                    return [];
                },
            },
        });
        Object.defineProperty(globalThis, "matchMedia", {
            configurable: true,
            value: () => {
                return {
                    matches: false,
                    addListener: () => {},
                    removeListener: () => {},
                };
            },
        });
    });

    beforeEach(function () {
        doc = new TestDocument();
        win = doc.createElement("window");
        canvas = doc.createElement("canvas");
        engine = new NullEngine();
        dsm = new DeviceSourceManager(engine);
    });

    afterEach(function () {
        doc.dispose();
        engine.dispose();
    });

    describe("DeviceSourceManager object", () => {
        it("should exist", () => {
            expect(dsm).not.toBeUndefined();
            expect(dsm.onDeviceConnectedObservable).not.toBeUndefined();
            expect(dsm.onDeviceDisconnectedObservable).not.toBeUndefined();
        });

        // TODO: Disable at eslint level (Ask Raanan if I can't figure it out)
        // eslint-disable-next-line jest/no-done-callback
        it("can use onDeviceConnectedObservable", (done: jest.DoneCallback) => {
            // TODO: Possibly set up custom (shorter) timeout
            dsm.onDeviceConnectedObservable.add((eventData) => {
                expect(eventData.deviceType).toBe(DeviceType.Mouse);
                expect(eventData.deviceSlot).toBe(0);

                done();
            });

            const evt = { pointerId: 0, type: "pointerdown", pointerType: "mouse", clientX: 1, clientY: 1 };
            canvas.dispatchEvent(evt);
        });

        it("can use onDeviceDisconnectedObservable", () => {
            const downEvt = { pointerId: 1, type: "pointerdown", pointerType: "touch", clientX: 1, clientY: 1 };
            const upEvt = { pointerId: 1, type: "pointerup", pointerType: "touch", clientX: 1, clientY: 1 };
            let deviceSlot = 1;
            dsm.onDeviceDisconnectedObservable.add((eventData) => {
                // TODO: Verify event data
                expect(eventData.deviceType).toBe(DeviceType.Touch);
                expect(eventData.deviceSlot).toBe(deviceSlot);
            });

            canvas.dispatchEvent(downEvt);

            // Because the device slot may differ from the actual touch pointerId, we're going to retrieve the assigned on and test against that
            deviceSlot = dsm.getDeviceSource(DeviceType.Touch)!.deviceSlot;
            canvas.dispatchEvent(upEvt);
        });

        it("can use getDeviceSource", () => {
            const evt = { pointerId: 0, type: "pointerdown", pointerType: "mouse", clientX: 1, clientY: 1 };
            canvas.dispatchEvent(evt);
            const mouseSource = dsm.getDeviceSource(DeviceType.Mouse);
            const mouseSource1 = dsm.getDeviceSource(DeviceType.Mouse, 0);
            const nullMouseSource = dsm.getDeviceSource(DeviceType.Mouse, 2);

            expect(mouseSource).not.toBeNull();
            expect(mouseSource).toEqual(mouseSource1);
            expect(nullMouseSource).toBeNull();
        });

        it("can use getDeviceSources", () => {
            // While our value for maxTouchPoints is 10, we want to make sure that the overflow gets ignored
            for (let i = 1; i <= 11; i++) {
                const evt = { pointerId: i, type: "pointerdown", pointerType: "touch", clientX: 1, clientY: 1 };
                canvas.dispatchEvent(evt);
            }

            // Check for valid maximum for touch
            expect(dsm.getDeviceSources(DeviceType.Touch).length).toBe(10);

            // Fire pointerup
            const evt = { pointerId: 5, type: "pointerup", pointerType: "touch", clientX: 1, clientY: 1 };
            canvas.dispatchEvent(evt);
            expect(dsm.getDeviceSources(DeviceType.Touch).length).toBe(9);

            // Check for entries that don't exist in DSM
            expect(dsm.getDeviceSources(DeviceType.Mouse).length).toBe(0);
        });
    });
});

describe("Picking behavior", () => {
    let doc = new TestDocument();
    let win = doc.createElement("window");
    let canvas = doc.createElement("canvas");
    let engine = new NullEngine();
    const scene = new Scene(engine);

    beforeAll(function () {
        NullEngine.prototype.getInputElement = () => {
            return canvas;
        };

        Object.defineProperty(globalThis, "document", {
            configurable: true,
            value: doc,
        });

        Object.defineProperty(globalThis, "window", {
            configurable: true,
            value: win,
        });
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: {
                maxTouchPoints: 10,
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36", // Treat as Chrome
                getGamePads: () => {
                    return [];
                },
            },
        });
        Object.defineProperty(globalThis, "matchMedia", {
            configurable: true,
            value: () => {
                return {
                    matches: false,
                    addListener: () => {},
                    removeListener: () => {},
                };
            },
        });
    });

    beforeEach(function () {
        doc = new TestDocument();
        win = doc.createElement("window");
        canvas = doc.createElement("canvas");
        engine = new NullEngine();
    });

    afterEach(function () {
        doc.dispose();
        engine.dispose();
    });

    it("test pick", async () => {
        const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(canvas, true);
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
        let pp = undefined;

        scene.onPointerObservable.add((eventData) => {
            console.log("TSTSFSDF");
        });

        scene.onPointerPick = (evt, pickInfo) => {
            console.log("PICK");
            pp = pickInfo.pickedMesh;
        };

        const evt = { pointerId: 1, type: "pointerdown", pointerType: "mouse", clientX: 256, clientY: 128 };
        canvas.dispatchEvent(evt);

        scene.pointerUpPredicate = (mesh: AbstractMesh): boolean => {
            return (
                mesh.isPickable &&
                mesh.isVisible &&
                mesh.isReady() &&
                mesh.isEnabled() &&
                (!scene.cameraToUseForPointers || (scene.cameraToUseForPointers.layerMask & mesh.layerMask) !== 0)
            );
        };

        const mesh = scene.pick(256, 128, scene.pointerUpPredicate, undefined, camera);
        console.log(pp);
        expect(mesh).not.toBeUndefined();
    });
});
