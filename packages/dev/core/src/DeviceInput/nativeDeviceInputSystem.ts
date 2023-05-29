import type { INative } from "../Engines/Native/nativeInterfaces";
import type { IUIEvent } from "../Events/deviceInputEvents";
import { DeviceEventFactory } from "./eventFactory";
import { DeviceType } from "./InputDevices/deviceEnums";
import type { IDeviceInputSystem } from "./inputInterfaces";

declare const _native: INative;

/** @internal */
export class NativeDeviceInputSystem implements IDeviceInputSystem {
    private readonly _nativeInput: IDeviceInputSystem;

    public constructor(
        onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void,
        onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void,
        onInputChanged: (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => void
    ) {
        this._nativeInput = _native.DeviceInputSystem
            ? new _native.DeviceInputSystem(onDeviceConnected, onDeviceDisconnected, (deviceType, deviceSlot, inputIndex, currentState) => {
                  const evt = DeviceEventFactory.CreateDeviceEvent(deviceType, deviceSlot, inputIndex, currentState, this);

                  onInputChanged(deviceType, deviceSlot, evt);
              })
            : this._createDummyNativeInput();
    }

    // Public functions
    /**
     * Checks for current device input value, given an id and input index. Throws exception if requested device not initialized.
     * @param deviceType Enum specifying device type
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
        return deviceType === DeviceType.Mouse || deviceType === DeviceType.Touch;
    }

    /**
     * Dispose of all the observables
     */
    public dispose(): void {
        this._nativeInput.dispose();
    }

    /**
     * For versions of BabylonNative that don't have the NativeInput plugin initialized, create a dummy version
     * @returns Object with dummy functions
     */
    private _createDummyNativeInput() {
        const nativeInput = {
            pollInput: () => {
                return 0;
            },
            isDeviceAvailable: () => {
                return false;
            },
            dispose: () => {},
        };

        return nativeInput;
    }
}
