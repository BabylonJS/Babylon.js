import { IEvent } from "../../Events/deviceInputEvents";
import { Observable } from "../../Misc/observable";
import { IDisposable } from "../../scene";
import { Nullable } from "../../types";
import { DeviceType } from "../InputDevices/deviceEnums";

/**
 * Interface for Observables in DeviceInputSystem
 */
export interface IDeviceEvent extends IEvent {
    /**
     * Device type
     */
    deviceType: DeviceType;
    /**
     * Device slot
     */
    deviceSlot: number;
    /**
     * Input array index
     */
    inputIndex: number;
    /**
     * Previous state of given input
     */
    previousState: Nullable<number>;
    /**
     * Current state of given input
     */
    currentState: Nullable<number>;
}

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
    onInputChanged: (deviceType: DeviceType, deviceSlot: number, inputIndex: number, previousState: Nullable<number>, currentState: Nullable<number>, eventData?: any) => void;

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
    // Observables
    /**
     * Observable for devices being connected
     */
    readonly onDeviceConnectedObservable: Observable<{ deviceType: DeviceType, deviceSlot: number }>;
    /**
     * Observable for devices being disconnected
     */
    readonly onDeviceDisconnectedObservable: Observable<{ deviceType: DeviceType, deviceSlot: number }>;
    /**
     * Observable for changes to device input
     */
    readonly onInputChangedObservable: Observable<IDeviceEvent>;

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