import { Nullable } from "../../types";
import { DeviceEventFactory } from "../Helpers/eventFactory";
import { DeviceType } from "../InputDevices/deviceEnums";
import { IDeviceEvent, IDeviceInputSystem, INativeInput } from "../Interfaces/inputInterfaces";

/** @hidden */
export class NativeDeviceInputSystem implements IDeviceInputSystem {
    public onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void;
    public onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void;
    public onInputChanged: (deviceEvent: IDeviceEvent) => void;

    private _nativeInput: INativeInput;

    public constructor(nativeInput?: INativeInput) {
        this._nativeInput = nativeInput || this._createDummyNativeInput();
        this.onDeviceConnected = (deviceType: DeviceType, deviceSlot: number) => { };
        this.onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => { };
        this.onInputChanged = (deviceEvent: IDeviceEvent) => { };

        this._nativeInput.onDeviceConnected = (deviceType, deviceSlot) => {
            this.onDeviceConnected(deviceType, deviceSlot);
        };

        this._nativeInput.onDeviceDisconnected = (deviceType, deviceSlot) => {
            this.onDeviceDisconnected(deviceType, deviceSlot);
        };

        this._nativeInput.onInputChanged = (deviceType, deviceSlot, inputIndex, previousState, currentState, eventData) => {
            const evt = DeviceEventFactory.CreateDeviceEvent(deviceType, deviceSlot, inputIndex, currentState, this);

            let deviceEvent = evt as IDeviceEvent;
            deviceEvent.deviceType = deviceType;
            deviceEvent.deviceSlot = deviceSlot;
            deviceEvent.inputIndex = inputIndex;
            deviceEvent.previousState = previousState;
            deviceEvent.currentState = currentState;

            this.onInputChanged(deviceEvent);
        };
    }

    /**
     * Configures events to work with an engine's active element
     */
    public configureEvents(): void {
        // Do nothing
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
    public isDeviceAvailable(deviceType: DeviceType) {
        //TODO: FIx native side first
        return (deviceType === DeviceType.Mouse || deviceType === DeviceType.Touch);
    }

    /**
     * Dispose of all the observables
     */
    public dispose(): void {
        this.onDeviceConnected = (deviceType: DeviceType, deviceSlot: number) => { };
        this.onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => { };
        this.onInputChanged = (deviceEvent: IDeviceEvent) => { };
    }

    /**
     * For versions of BabylonNative that don't have the NativeInput plugin initialized, create a dummy version
     * @returns Object with dummy functions
     */
    private _createDummyNativeInput() {
        let nativeInput = {
            onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => { },
            onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => { },
            onInputChanged: (deviceType: DeviceType, deviceSlot: number, inputIndex: number, previousState: Nullable<number>, currentState: Nullable<number>, eventData?: any) => { },
            pollInput: () => { return 0; },
            isDeviceAvailable: () => { return false; },
            dispose: () => { },
        };

        return nativeInput;
    }
}