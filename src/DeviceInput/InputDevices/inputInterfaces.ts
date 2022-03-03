import { IUIEvent } from "../../Events/deviceInputEvents";
import { IDisposable } from "../../scene";
import { Nullable } from "../../types";
import { DeviceType } from "./deviceEnums";

/**
 * Interface for NativeInput object
 */
export interface INativeInput extends IDisposable {
    /**
     * Callback for when a device is connected
     */
    onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void;

    /**
     * Callback for when a device is disconnected
     */
    onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void;

    /**
     * Callback for when input is changed on a device
     */
    onInputChanged: (deviceType: DeviceType, deviceSlot: number, inputIndex: number, previousState: Nullable<number>, currentState: Nullable<number>) => void;

    /**
     * Checks for current device input value, given an id and input index.
     * @param deviceType Type of device
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

/**
 * Interface for DeviceInputSystem implementations (JS and Native)
 */
export interface IDeviceInputSystem extends IDisposable {
    // Callbacks
    /**
     * Callback for when a device is connected
     */
    onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void;

    /**
     * Callback for when a device is disconnected
     */
    onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void;

    /**
     * Callback for when an input is changed
     */
    onInputChanged: (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => void;

    // Functions
    /**
     * Checks for current device input value, given an id and input index. Throws exception if requested device not initialized.
     * @param deviceType Enum specifiying device type
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
