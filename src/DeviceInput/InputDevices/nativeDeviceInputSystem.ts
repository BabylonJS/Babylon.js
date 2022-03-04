import { IUIEvent } from "../../Events/deviceInputEvents";
import { Nullable } from "../../types";
import { DeviceEventFactory } from "../Helpers/eventFactory";
import { DeviceType, NativePointerInput, PointerInput } from "./deviceEnums";
import { IDeviceInputSystem, INativeInput } from "./inputInterfaces";

/** @hidden */
export class NativeDeviceInputSystem implements IDeviceInputSystem {
    public onDeviceConnected = (deviceType: DeviceType, deviceSlot: number) => { };
    public onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => { };
    public onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => { };

    private readonly _nativeInput: INativeInput;

    public constructor(nativeInput?: INativeInput) {
        this._nativeInput = nativeInput || this._createDummyNativeInput();

        this._nativeInput.onDeviceConnected = (deviceType, deviceSlot) => {
            this.onDeviceConnected(deviceType, deviceSlot);
        };

        this._nativeInput.onDeviceDisconnected = (deviceType, deviceSlot) => {
            this.onDeviceDisconnected(deviceType, deviceSlot);
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
}