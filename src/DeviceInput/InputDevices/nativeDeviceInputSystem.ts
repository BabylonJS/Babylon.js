import { IUIEvent } from "../../Events/deviceInputEvents";
import { Nullable } from "../../types";
import { DeviceEventFactory } from "../Helpers/eventFactory";
import { DeviceType, NativePointerInput, PointerInput } from "./deviceEnums";
import { IDeviceInputSystem, INativeInput } from "./inputInterfaces";

/** @hidden */
export class NativeDeviceInputSystem implements IDeviceInputSystem {
    /** onDeviceConnected property */
    public set onDeviceConnected(callback: (deviceType: DeviceType, deviceSlot: number) => void) {
        this._onDeviceConnected = callback;

        // Iterate through each active device and rerun new callback
        for (let deviceType = 0; deviceType < this._inputs.length; deviceType++) {
            const inputs = this._inputs[deviceType];
            if (inputs) {
                for (const deviceSlotKey in inputs) {
                    const deviceSlot = +deviceSlotKey;
                    this._onDeviceConnected(deviceType, deviceSlot);
                }
            }
        }
    }

    public get onDeviceConnected(): (deviceType: DeviceType, deviceSlot: number) => void {
        return this._onDeviceConnected;
    }
    public onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => { };
    public onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => { };

    private readonly _nativeInput: INativeInput;
    private _onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void = (deviceType: DeviceType, deviceSlot: number) => { };
    private _inputs: Array<Array<number>> = [];

    public constructor(nativeInput?: INativeInput) {
        this._nativeInput = nativeInput || this._createDummyNativeInput();

        this._nativeInput.onDeviceConnected = (deviceType, deviceSlot) => {
            this._registerDevice(deviceType, deviceSlot);
            this.onDeviceConnected(deviceType, deviceSlot);
        };

        this._nativeInput.onDeviceDisconnected = (deviceType, deviceSlot) => {
            this.onDeviceDisconnected(deviceType, deviceSlot);
            this._unregisterDevice(deviceType, deviceSlot);
        };

        this._nativeInput.onInputChanged = (deviceType, deviceSlot, inputIndex, currentState) => {
            const idx = (inputIndex === NativePointerInput.Horizontal || inputIndex === NativePointerInput.Vertical || inputIndex === NativePointerInput.DeltaHorizontal || inputIndex === NativePointerInput.DeltaVertical) ? PointerInput.Move : inputIndex;
            const evt = DeviceEventFactory.CreateDeviceEvent(deviceType, deviceSlot, idx, currentState, this);

            this.onInputChanged(deviceType, deviceSlot, evt);
        };
    }

    // Public functions
    /**
     * Checks for current device input value, given an id and input index. Throws exception if requested device not initialized.
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     * @returns Current value of input
     */
    public pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
        return this._nativeInput.pollInput(deviceType, deviceSlot, inputIndex);
    }

    /**
     * Check for a specific device in the DeviceInputSystem
     * @param deviceType Type of device to check for
     * @returns bool with status of device's existence
     */
    public isDeviceAvailable(deviceType: DeviceType): boolean {
        //TODO: FIx native side first
        return (deviceType === DeviceType.Mouse || deviceType === DeviceType.Touch);
    }

    /**
     * Dispose of all the observables
     */
    public dispose(): void {
        this.onDeviceConnected = () => { };
        this.onDeviceDisconnected = () => { };
        this.onInputChanged = () => { };
    }

    /**
     * For versions of BabylonNative that don't have the NativeInput plugin initialized, create a dummy version
     * @returns Object with dummy functions
     */
    private _createDummyNativeInput() {
        let nativeInput = {
            onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => { },
            onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => { },
            onInputChanged: (deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: Nullable<number>) => { },
            pollInput: () => { return 0; },
            isDeviceAvailable: () => { return false; },
            dispose: () => { },
        };

        return nativeInput;
    }

    /**
     * Add device and inputs to device array
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     */
    private _registerDevice(deviceType: DeviceType, deviceSlot: number): void {
        if (deviceSlot === undefined) {
            throw `Unable to register device ${DeviceType[deviceType]} to undefined slot.`;
        }

        if (!this._inputs[deviceType]) {
            this._inputs[deviceType] = [];
        }

        this._inputs[deviceType].push(deviceSlot);
    }

    /**
     * Given a specific device name, remove that device from the device map
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     */
    private _unregisterDevice(deviceType: DeviceType, deviceSlot: number): void {
        if (this._inputs[deviceType]) {
            const idx = this._inputs[deviceType].indexOf(deviceSlot);

            if (idx > -1) {
                this._inputs[deviceType].splice(idx, 1);
            }
        }
    }
}