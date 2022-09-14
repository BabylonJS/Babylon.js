import { DeviceSource, DeviceSourceManager, DeviceType, PointerInput } from "core/DeviceInput";
import { DeviceEventFactory } from "core/DeviceInput/eventFactory";
import type { IDeviceInputSystem } from "core/DeviceInput/inputInterfaces";
import { InternalDeviceSourceManager } from "core/DeviceInput/internalDeviceSourceManager";
import { WebDeviceInputSystem } from "core/DeviceInput/webDeviceInputSystem";
import type { Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import type { IPointerEvent, IUIEvent } from "core/Events";
import type { Nullable } from "core/types";

interface ITestDeviceInputSystem {
    connectDevice(deviceType: DeviceType, deviceSlot: number, numberOfInputs: number): void;
    disconnectDevice(deviceType: DeviceType, deviceSlot: number): void;
    changeInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: number): void;
}

class TestDeviceInputSystem implements ITestDeviceInputSystem {
    // Values to use for numberOfInputs
    public static MAX_KEYCODES = 255;
    public static MAX_POINTER_INPUTS = 12;

    private _inputs: Array<{ [deviceSlot: number]: Array<number> }>;
    private _onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void;
    private _onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void;
    private _onInputChanged: (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => void;

    constructor(
        _engine: Engine,
        onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void,
        onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void,
        onInputChanged: (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => void
    ) {
        this._inputs = new Array<{ [deviceSlot: number]: Array<number> }>();
        this._onDeviceConnected = onDeviceConnected;
        this._onDeviceDisconnected = onDeviceDisconnected;
        this._onInputChanged = onInputChanged;
    }

    public static ConvertToITestDISRef(dis: IDeviceInputSystem): ITestDeviceInputSystem {
        return dis as unknown as ITestDeviceInputSystem;
    }

    public pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
        const device = this._inputs[deviceType][deviceSlot];

        if (!device) {
            throw `Unable to find device ${DeviceType[deviceType]}`;
        }

        const currentValue = device[inputIndex];
        if (currentValue === undefined) {
            throw `Unable to find input ${inputIndex} for device ${DeviceType[deviceType]} in slot ${deviceSlot}`;
        }

        return currentValue;
    }

    public isDeviceAvailable(deviceType: DeviceType): boolean {
        return this._inputs[deviceType] !== undefined;
    }

    public connectDevice(deviceType: DeviceType, deviceSlot: number, numberOfInputs: number): void {
        if (!this._inputs[deviceType]) {
            this._inputs[deviceType] = {};
        }

        if (!this._inputs[deviceType][deviceSlot]) {
            const device = new Array<number>(numberOfInputs);
            device.fill(0);
            this._inputs[deviceType][deviceSlot] = device;
            this._onDeviceConnected(deviceType, deviceSlot);
        }
    }

    public disconnectDevice(deviceType: DeviceType, deviceSlot: number): void {
        if (this._inputs[deviceType][deviceSlot]) {
            delete this._inputs[deviceType][deviceSlot];
            this._onDeviceDisconnected(deviceType, deviceSlot);
        }
    }

    public changeInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: number): void {
        if (!this._inputs[deviceType]) {
            throw `Unable to find device type ${DeviceType[deviceType]}`;
        }

        const device = this._inputs[deviceType][deviceSlot];
        if (device) {
            device[inputIndex] = currentState;
            const evt = DeviceEventFactory.CreateDeviceEvent(deviceType, deviceSlot, inputIndex, currentState, this as unknown as IDeviceInputSystem);
            this._onInputChanged(deviceType, deviceSlot, evt);
        } else {
            throw `Unable to find device type ${DeviceType[deviceType]}:${deviceSlot}`;
        }
    }

    public dispose(): void {
        this._onDeviceConnected = () => {};
        this._onDeviceDisconnected = () => {};
        this._onInputChanged = () => {};
    }
}

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

describe("DeviceSource", () => {
    let engine: Nullable<NullEngine> = null;
    let wdis: Nullable<IDeviceInputSystem> = null;

    beforeEach(() => {
        engine = new NullEngine();
        wdis = new WebDeviceInputSystem(
            engine,
            () => {},
            () => {},
            () => {}
        );
    });

    afterEach(() => {
        engine!.dispose();
        wdis!.dispose();
    });

    it("should exist", () => {
        const mouseSource = new DeviceSource(wdis!, DeviceType.Mouse, 0);
        expect(mouseSource.deviceType).toBe(DeviceType.Mouse);
        expect(mouseSource.deviceSlot).toBe(0);
        expect(mouseSource.onInputChangedObservable).not.toBeUndefined();
    });

    it("can poll with getInput", () => {
        const testDIS: ITestDeviceInputSystem = TestDeviceInputSystem.ConvertToITestDISRef(wdis!);
        // Connect Mouse
        testDIS.connectDevice(DeviceType.Mouse, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);

        // Create source and check that left click is there but not pressed
        const mouseSource = new DeviceSource(wdis!, DeviceType.Mouse, 0);
        const leftClickUp = mouseSource.getInput(PointerInput.LeftClick);
        expect(leftClickUp).toBe(0);

        // Press left-click and check again
        testDIS.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
        const leftClickDown = mouseSource.getInput(PointerInput.LeftClick);
        expect(leftClickDown).toBe(1);
    });
});

describe("DeviceSourceManager", () => {
    let engine: Nullable<NullEngine> = null;

    beforeEach(() => {
        engine = new NullEngine();
    });

    afterEach(() => {
        engine!.dispose();
    });

    it("should exist", () => {
        new DeviceSourceManager(engine!);
        expect(engine!._deviceSourceManager).not.toBe(null);
        expect(engine!._deviceSourceManager!._refCount).toBe(1);
    });

    it("can use getDeviceSource", () => {
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = TestDeviceInputSystem.ConvertToITestDISRef(engine!._deviceSourceManager!._deviceInputSystem);
        const nullSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);

        // Verify that non-existant sources will be null
        expect(nullSource).toBe(null);

        deviceInputSystem.connectDevice(DeviceType.Touch, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);
        deviceInputSystem.connectDevice(DeviceType.Touch, 1, TestDeviceInputSystem.MAX_POINTER_INPUTS);

        // After adding touches, get their DeviceSource objects
        const touchSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);
        const touchSource2 = deviceSourceManager.getDeviceSource(DeviceType.Touch, 1);

        // Grab touch sources using different criteria
        const firstAvailableSource = deviceSourceManager.getDeviceSource(DeviceType.Touch);
        const specificSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 1);

        expect(firstAvailableSource).toEqual(touchSource);
        expect(specificSource).toEqual(touchSource2);

        deviceInputSystem.disconnectDevice(DeviceType.Touch, 0);

        const nextFirstSource = deviceSourceManager.getDeviceSource(DeviceType.Touch);
        expect(nextFirstSource).toEqual(touchSource2);
    });

    it("can use getDeviceSources", () => {
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = TestDeviceInputSystem.ConvertToITestDISRef(engine!._deviceSourceManager!._deviceInputSystem);

        const emptyArray = deviceSourceManager.getDeviceSources(DeviceType.Touch);
        expect(emptyArray.length).toBe(0);

        deviceInputSystem.connectDevice(DeviceType.Touch, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);
        deviceInputSystem.connectDevice(DeviceType.Touch, 1, TestDeviceInputSystem.MAX_POINTER_INPUTS);

        const touchArray = deviceSourceManager.getDeviceSources(DeviceType.Touch);
        const touchSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);
        const touchSource2 = deviceSourceManager.getDeviceSource(DeviceType.Touch, 1);
        expect(touchArray.length).toBe(2);
        expect(touchArray[0]).toBe(touchSource);
        expect(touchArray[1]).toBe(touchSource2);
    });

    it("can use onDeviceConnectedObservable", () => {
        expect.assertions(1);
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = TestDeviceInputSystem.ConvertToITestDISRef(engine!._deviceSourceManager!._deviceInputSystem);
        let observableSource = null;

        deviceSourceManager.onDeviceConnectedObservable.add((deviceSource) => {
            observableSource = deviceSource;
        });

        deviceInputSystem.connectDevice(DeviceType.Touch, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);
        const touchSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);

        expect(observableSource).toEqual(touchSource);
    });

    it("can use onDeviceDisconnectedObservable", () => {
        expect.assertions(3);
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = TestDeviceInputSystem.ConvertToITestDISRef(engine!._deviceSourceManager!._deviceInputSystem);
        let observableSource = null;

        deviceSourceManager.onDeviceDisconnectedObservable.add((deviceSource) => {
            observableSource = deviceSource;
        });

        // Connect Device and check for existence
        deviceInputSystem.connectDevice(DeviceType.Touch, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);
        expect(deviceSourceManager.getDeviceSources(DeviceType.Touch).length).toBe(1);
        const touchSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);

        // Disconnect same device and check that it's not there
        deviceInputSystem.disconnectDevice(DeviceType.Touch, 0);
        expect(observableSource).toEqual(touchSource);
        const nullSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);
        expect(nullSource).toBe(null);
    });

    it("can talk to DeviceSource onInputChangedObservable", () => {
        expect.assertions(2);
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = TestDeviceInputSystem.ConvertToITestDISRef(engine!._deviceSourceManager!._deviceInputSystem);
        let observableEvent: Nullable<IPointerEvent> = null;

        // Connect device and grab DeviceSource
        deviceInputSystem.connectDevice(DeviceType.Mouse, 0, TestDeviceInputSystem.MAX_POINTER_INPUTS);
        const mouseSource = deviceSourceManager.getDeviceSource(DeviceType.Mouse, 0);

        // Set observable for change in input
        mouseSource!.onInputChangedObservable.add((eventData) => {
            if ("pointerId" in eventData) {
                observableEvent = eventData;
            }
        });

        // Click proper mouse LMB and verify event
        deviceInputSystem.changeInput(DeviceType.Mouse, 0, PointerInput.LeftClick, 1);
        expect(observableEvent!.pointerId).toEqual(1);
        expect(observableEvent!.button).toEqual(0);
    });

    it("can handle separate instances of DeviceSourceManager", () => {
        // Because order of creation matters with spying, we need to manually create the InternalDeviceSourceManager
        engine!._deviceSourceManager = new InternalDeviceSourceManager(engine!);
        const internalDeviceSourceManager = engine!._deviceSourceManager!;

        const registerSpy = jest.spyOn(internalDeviceSourceManager, "registerManager");
        const unregisterSpy = jest.spyOn(internalDeviceSourceManager, "unregisterManager");
        const disposeSpy = jest.spyOn(internalDeviceSourceManager, "dispose");

        // When we use these constructors, it should pull our pre-made IDSM
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
});
