import { DeviceSource, DeviceSourceManager, DeviceType, PointerInput } from "core/DeviceInput";
import type { IDeviceInputSystem } from "core/DeviceInput/InputDevices/inputInterfaces";
import type { InternalDeviceSourceManager, IObservableManager } from "core/DeviceInput/InputDevices/internalDeviceSourceManager";
import { WebDeviceInputSystem } from "core/DeviceInput/InputDevices/webDeviceInputSystem";
import { Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import type { IPointerEvent, IUIEvent, IWheelEvent } from "core/Events";
import type { Nullable } from "core/types";

/**
 * This class mocks up the basic functionality required from the DeviceInputSystem
 */
/*class MockDeviceInputSystem implements IDeviceInputSystem {
    constructor(
        public onDeviceConnected: Nullable<(deviceType: DeviceType, deviceSlot: number) => void>,
        public onDeviceDisconnected: Nullable<(deviceType: DeviceType, deviceSlot: number) => void>,
        public onInputChanged: Nullable<(deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => void>
    ) {}
    pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
        if (deviceType === DeviceType.Mouse && deviceSlot === 0 && inputIndex === PointerInput.LeftClick) {
            return 1;
        } else {
            return 0;
        }
    }
    isDeviceAvailable(deviceType: DeviceType): boolean {
        return deviceType === DeviceType.Mouse || deviceType === DeviceType.Touch;
    }
    dispose(): void {
        // Do nothing
    }
}*/
jest.mock("core/DeviceInput/InputDevices/webDeviceInputSystem");

/*class MockInternalDeviceSourceManager {
    public _refCount = 0;

    constructor() {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public readonly registerManager = (manager: IObservableManager): void => {
        // Do nothing
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public readonly unregisterManager = (manager: IObservableManager): void => {
        // Do nothing
    };

    public dispose(): void {}
}*/

describe("DeviceSource", () => {
    let engine: Nullable<NullEngine> = null;
    let wdis: Nullable<IDeviceInputSystem> = null;
    const onDeviceConnected = (deviceType: DeviceType, deviceSlot: number) => {};
    const onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => {};
    let onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => {};

    beforeAll(() => {
        WebDeviceInputSystem.mockImplementation(() => {
            return {
                pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
                    if (deviceType) {
                        return 1;
                    }
                    return 0;
                },
                isDeviceAvailable(deviceType: DeviceType): boolean {
                    return true;
                },
                dispose: void {
                    // Do Nothing
                },
            }
        });
    });

    beforeEach(() => {
        engine = new NullEngine();
        wdis = new WebDeviceInputSystem(engine, onDeviceConnected, onDeviceDisconnected, onInputChanged);
    });

    it("should exist", () => {
        const mouseSource = new DeviceSource(wdis!, DeviceType.Mouse, 0);
        expect(mouseSource).not.toBeNull();
        expect(mouseSource.deviceType).toBe(DeviceType.Mouse);
        expect(mouseSource.deviceSlot).toBe(0);
        expect(mouseSource.onInputChangedObservable).not.toBeUndefined();
    });
    it("can poll with getInput", () => {
        const mouseSource = new DeviceSource(wdis!, DeviceType.Mouse, 0);
        const leftClick = mouseSource.getInput(PointerInput.LeftClick);
        expect(leftClick).toBe(1);
    });
    it("can use onInputChangedObservable", () => {
        expect.assertions(2);
        let resultEvent: Nullable<IWheelEvent | IPointerEvent> = null;

        // Create DeviceSource and add to its observable
        const mouseSource = new DeviceSource(wdis!, DeviceType.Mouse, 0);
        onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => {
            mouseSource.onInputChangedObservable.notifyObservers(eventData as IPointerEvent);
        };
        mouseSource.onInputChangedObservable.add((eventData) => {
            resultEvent = eventData;
        });

        expect(mouseSource.onInputChangedObservable.hasObservers()).toBe(true);
        const mouseEvent: IUIEvent = { pointerId: 0, type: "pointerdown", pointerType: "mouse", clientX: 1, clientY: 1 } as IPointerEvent;
        onInputChanged(DeviceType.Mouse, 0, mouseEvent);

        expect(resultEvent).toEqual(mouseEvent);
    });
});
/*
describe("DeviceSourceManager", () => {
    let engine: Nullable<NullEngine> = null;

    beforeEach(function () {
        engine = new NullEngine();
        engine._deviceSourceManager = new MockInternalDeviceSourceManager() as InternalDeviceSourceManager;
    });

    afterEach(function () {
        engine?.dispose();
    });

    it("should exist", () => {
        const deviceSourceManager = new DeviceSourceManager(engine!);
        expect(deviceSourceManager).not.toBe(null);
        expect(engine?._deviceSourceManager?._refCount).toBe(1);
    });

    it("can use getDeviceSource", () => {
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = new MockDeviceInputSystem(null, null, null);
        const touchSource = new DeviceSource(deviceInputSystem, DeviceType.Touch, 0);
        const touchSource2 = new DeviceSource(deviceInputSystem, DeviceType.Touch, 1);
        const nullSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);
        expect(nullSource).toBe(null);

        deviceSourceManager._addDevice(touchSource);
        deviceSourceManager._addDevice(touchSource2);

        const firstAvailableSource = deviceSourceManager.getDeviceSource(DeviceType.Touch);
        const specificSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 1);

        expect(firstAvailableSource).toEqual(touchSource);
        expect(specificSource).toEqual(touchSource2);

        deviceSourceManager._removeDevice(DeviceType.Touch, 0);

        const nextFirstSource = deviceSourceManager.getDeviceSource(DeviceType.Touch);
        expect(nextFirstSource).toEqual(touchSource2);
    });

    it("can use getDeviceSources", () => {
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = new MockDeviceInputSystem(null, null, null);
        const touchSource = new DeviceSource(deviceInputSystem, DeviceType.Touch, 0);
        const touchSource2 = new DeviceSource(deviceInputSystem, DeviceType.Touch, 1);
        const emptyArray = deviceSourceManager.getDeviceSources(DeviceType.Touch);

        expect(emptyArray.length).toBe(0);

        deviceSourceManager._addDevice(touchSource);
        deviceSourceManager._addDevice(touchSource2);

        const touchArray = deviceSourceManager.getDeviceSources(DeviceType.Touch);
        expect(touchArray.length).toBe(2);
    });

    it("can use onDeviceConnectedObservable", () => {
        expect.assertions(1);
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = new MockDeviceInputSystem(null, null, null);
        const touchSource = new DeviceSource(deviceInputSystem, DeviceType.Touch, 0);
        let observableSource = null;

        deviceSourceManager.onDeviceConnectedObservable.add((eventData) => {
            observableSource = eventData;
        });

        deviceSourceManager._addDevice(touchSource);

        expect(observableSource).toEqual(touchSource);
    });

    it("can use onDeviceDisconnectedObservable", () => {
        expect.assertions(2);
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = new MockDeviceInputSystem(null, null, null);
        const touchSource = new DeviceSource(deviceInputSystem, DeviceType.Touch, 0);
        let observableSource = null;

        deviceSourceManager.onDeviceDisconnectedObservable.add((eventData) => {
            observableSource = eventData;
        });

        deviceSourceManager._addDevice(touchSource);
        deviceSourceManager._removeDevice(DeviceType.Touch, 0);

        const nullSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);

        expect(observableSource).toEqual(touchSource);
        expect(nullSource).toBe(null);
    });

    it("can talk to DeviceSource onInputChangedObservable", () => {
        expect.assertions(2);
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = new MockDeviceInputSystem(null, null, null);
        const mouseSource = new DeviceSource(deviceInputSystem, DeviceType.Mouse, 0);
        let observableEvent = null;

        mouseSource.onInputChangedObservable.add((eventData) => {
            observableEvent = eventData;
        });

        const mouseEvent: IUIEvent = { pointerId: 0, type: "pointerdown", pointerType: "mouse", clientX: 1, clientY: 1 } as IPointerEvent;

        // Try to call _onInputChanged without any added DeviceSources
        deviceSourceManager._onInputChanged(DeviceType.Mouse, 0, mouseEvent);
        expect(observableEvent).toBe(null);

        // Add Mouse Source and then perform same action
        deviceSourceManager._addDevice(mouseSource);
        deviceSourceManager._onInputChanged(DeviceType.Mouse, 0, mouseEvent);
        expect(observableEvent).toEqual(mouseEvent);
    });

    it("can handle separate instances of DeviceSourceManager", () => {
        const internalDeviceSourceManager = engine!._deviceSourceManager!;
        const registerSpy = jest.spyOn(internalDeviceSourceManager, "registerManager");
        const unregisterSpy = jest.spyOn(internalDeviceSourceManager, "unregisterManager");
        const disposeSpy = jest.spyOn(internalDeviceSourceManager, "dispose");
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceSourceManager2 = new DeviceSourceManager(engine!);
        const deviceSourceManager3 = new DeviceSourceManager(engine!);

        expect(internalDeviceSourceManager._refCount).toBe(3);
        expect(registerSpy).toBeCalledTimes(3);

        // Dispose of one DSM and verify that our IDSM still remains
        deviceSourceManager.dispose();
        expect(unregisterSpy).toBeCalledTimes(1);
        expect(disposeSpy).toBeCalledTimes(0);

        // Dispose of all the rest and verify that IDSM is disposed of
        deviceSourceManager2.dispose();
        deviceSourceManager3.dispose();
        expect(unregisterSpy).toBeCalledTimes(3);
        expect(disposeSpy).toBeCalledTimes(1);
    });
});*/
