import { DeviceSource, DeviceSourceManager, DeviceType, PointerInput } from "core/DeviceInput";
import { DeviceEventFactory } from "core/DeviceInput/Helpers/eventFactory";
import type { IDeviceInputSystem } from "core/DeviceInput/InputDevices/inputInterfaces";
import { InternalDeviceSourceManager } from "core/DeviceInput/InputDevices/internalDeviceSourceManager";
import { WebDeviceInputSystem } from "core/DeviceInput/InputDevices/webDeviceInputSystem";
import type { Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import type { IPointerEvent, IUIEvent } from "core/Events";
import type { Nullable } from "core/types";

jest.mock("core/DeviceInput/InputDevices/webDeviceInputSystem");

describe("DeviceSource", () => {
    let engine: Nullable<NullEngine> = null;
    let wdis: Nullable<IDeviceInputSystem> = null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onDeviceConnected = (deviceType: DeviceType, deviceSlot: number) => {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => {};

    beforeAll(() => {
        WebDeviceInputSystem.mockImplementation((
            engine: Engine,
            onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void,
            onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void,
            onInputChanged: (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => void) => {
            return {
                _onDeviceConnected: onDeviceConnected,
                _onDeviceDisconnected: onDeviceDisconnected,
                _onInputChanged: onInputChanged,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
                    return 0;
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                isDeviceAvailable(deviceType: DeviceType): boolean {
                    return true;
                },
                connectDevice(deviceType: DeviceType, deviceSlot: number): void {
                    onDeviceConnected(deviceType, deviceSlot);
                },
                disconnectDevice(deviceType: DeviceType, deviceSlot: number): void {
                    onDeviceDisconnected(deviceType, deviceSlot);
                },
                changeInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: number): void {
                    const evt = DeviceEventFactory.CreateDeviceEvent(deviceType, deviceSlot, inputIndex, currentState, this as unknown as IDeviceInputSystem);
                    onInputChanged(deviceType, deviceSlot, evt);
                },
                dispose(): void {
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
        expect(mouseSource.deviceType).toBe(DeviceType.Mouse);
        expect(mouseSource.deviceSlot).toBe(0);
        expect(mouseSource.onInputChangedObservable).not.toBeUndefined();
    });
    it("can poll with getInput", () => {
        const mouseSource = new DeviceSource(wdis!, DeviceType.Mouse, 0);
        const leftClick = mouseSource.getInput(PointerInput.LeftClick);
        expect(leftClick).toBe(0);
    });
});

describe("DeviceSourceManager", () => {
    let engine: Nullable<NullEngine> = null;

    beforeAll(() => {
        WebDeviceInputSystem.mockImplementation((
            engine: Engine,
            onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void,
            onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void,
            onInputChanged: (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => void) => {
            return {
                _onDeviceConnected: onDeviceConnected,
                _onDeviceDisconnected: onDeviceDisconnected,
                _onInputChanged: onInputChanged,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
                    return 0;
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                isDeviceAvailable(deviceType: DeviceType): boolean {
                    return true;
                },
                connectDevice(deviceType: DeviceType, deviceSlot: number): void {
                    onDeviceConnected(deviceType, deviceSlot);
                },
                disconnectDevice(deviceType: DeviceType, deviceSlot: number): void {
                    onDeviceDisconnected(deviceType, deviceSlot);
                },
                changeInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: number): void {
                    const evt = DeviceEventFactory.CreateDeviceEvent(deviceType, deviceSlot, inputIndex, currentState, this as unknown as IDeviceInputSystem);
                    onInputChanged(deviceType, deviceSlot, evt);
                },
                dispose(): void {
                    // Do Nothing
                },
            }
        });
    });

    beforeEach(() => {
        engine = new NullEngine();
    });

    afterEach(function () {
        engine!.dispose();
    });

    it("should exist", () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const deviceSourceManager = new DeviceSourceManager(engine!);
        expect(engine!._deviceSourceManager).not.toBe(null);
        expect(engine!._deviceSourceManager!._refCount).toBe(1);
    });

    it("can use getDeviceSource", () => {
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = engine!._deviceSourceManager!._deviceInputSystem as any;
        const nullSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);
        
        // Verify that non-existant sources will be null
        expect(nullSource).toBe(null);

        deviceInputSystem.connectDevice(DeviceType.Touch, 0);
        deviceInputSystem.connectDevice(DeviceType.Touch, 1);

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
        const deviceInputSystem = engine!._deviceSourceManager!._deviceInputSystem as any;

        const emptyArray = deviceSourceManager.getDeviceSources(DeviceType.Touch);
        expect(emptyArray.length).toBe(0);

        deviceInputSystem.connectDevice(DeviceType.Touch, 0);
        deviceInputSystem.connectDevice(DeviceType.Touch, 1);

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
        const deviceInputSystem = engine!._deviceSourceManager!._deviceInputSystem as any;
        let observableSource = null;

        deviceSourceManager.onDeviceConnectedObservable.add((deviceSource) => {
            observableSource = deviceSource;
        });

        deviceInputSystem.connectDevice(DeviceType.Touch, 0);
        const touchSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);

        expect(observableSource).toEqual(touchSource);
    });

    it("can use onDeviceDisconnectedObservable", () => {
        expect.assertions(3);
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = engine!._deviceSourceManager!._deviceInputSystem as any;
        let observableSource = null;

        deviceSourceManager.onDeviceDisconnectedObservable.add((deviceSource) => {
            observableSource = deviceSource;
        });

        // Connect Device and check for existence
        deviceInputSystem.connectDevice(DeviceType.Touch, 0);
        expect(deviceSourceManager.getDeviceSources(DeviceType.Touch).length).toBe(1);
        const touchSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);

        // Disconnect same device and check that it's not there
        deviceInputSystem.disconnectDevice(DeviceType.Touch, 0);
        expect(observableSource).toEqual(touchSource);
        const nullSource = deviceSourceManager.getDeviceSource(DeviceType.Touch, 0);
        expect(nullSource).toBe(null);
    });

    it("can talk to DeviceSource onInputChangedObservable", () => {
        expect.assertions(3);
        const deviceSourceManager = new DeviceSourceManager(engine!);
        const deviceInputSystem = engine!._deviceSourceManager!._deviceInputSystem as any;
        let observableEvent: Nullable<IPointerEvent> = null;

        // Connect device and grab DeviceSource
        deviceInputSystem.connectDevice(DeviceType.Mouse, 0);
        const mouseSource = deviceSourceManager.getDeviceSource(DeviceType.Mouse, 0);

        // Set observable for change in input
        mouseSource!.onInputChangedObservable.add((eventData) => {
            observableEvent = eventData as IPointerEvent;
        });

        // Click a non-existent mouse and nothing should come up
        deviceInputSystem.changeInput(DeviceType.Mouse, 1, PointerInput.LeftClick, 1);
        expect(observableEvent).toBe(null);
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
