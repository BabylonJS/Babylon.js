import type { IDisposable } from "../scene";
import type { DeviceType } from "./InputDevices/deviceEnums";

/**
 * Interface for DeviceInputSystem implementations (JS and Native)
 */
export interface IDeviceInputSystem extends IDisposable {
    /**
     * Checks for current device input value, given an id and input index. Throws exception if requested device not initialized.
     * @param deviceType Enum specifying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     * @returns Current value of input
     */
    pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number;

    /**
     * Check for a specific device in the DeviceInputSystem
     * @param deviceType Type of device to check for
     * @returns bool with status of device's existence
     */
    isDeviceAvailable(deviceType: DeviceType): boolean;
}
