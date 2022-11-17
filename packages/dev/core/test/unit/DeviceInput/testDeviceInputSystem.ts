import { DeviceEventFactory } from "core/DeviceInput/eventFactory";
import { DeviceType } from "core/DeviceInput/InputDevices/deviceEnums";
import type { IDeviceInputSystem } from "core/DeviceInput/inputInterfaces";
import type { Engine } from "core/Engines/engine";
import type { IUIEvent } from "core/Events/deviceInputEvents";

export interface ITestDeviceInputSystem {
    connectDevice(deviceType: DeviceType, deviceSlot: number, numberOfInputs: number): void;
    disconnectDevice(deviceType: DeviceType, deviceSlot: number): void;
    changeInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: number, createEvent?: boolean): void;
    pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number;
}

export class TestDeviceInputSystem implements ITestDeviceInputSystem {
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

    public changeInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: number, createEvent: boolean = true): void {
        if (!this._inputs[deviceType]) {
            throw `Unable to find device type ${DeviceType[deviceType]}`;
        }

        const device = this._inputs[deviceType][deviceSlot];
        
            if (device) {
                device[inputIndex] = currentState;
                if (createEvent) {
                const evt = DeviceEventFactory.CreateDeviceEvent(deviceType, deviceSlot, inputIndex, currentState, this as unknown as IDeviceInputSystem);
                this._onInputChanged(deviceType, deviceSlot, evt);
                }
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