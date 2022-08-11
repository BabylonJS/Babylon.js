import type { DeviceType } from "./deviceEnums";
import { Observable } from "../../Misc/observable";
import type { DeviceInput } from "./deviceTypes";
import type { IDeviceInputSystem } from "../inputInterfaces";
import type { IKeyboardEvent, IPointerEvent, IWheelEvent } from "../../Events/deviceInputEvents";

/**
 * Subset of DeviceInput that only handles pointers and keyboard
 */
export type DeviceSourceEvent<T extends DeviceType> = T extends DeviceType.Keyboard
    ? IKeyboardEvent
    : T extends DeviceType.Mouse
    ? IWheelEvent | IPointerEvent
    : T extends DeviceType.Touch
    ? IPointerEvent
    : never;

/**
 * Class that handles all input for a specific device
 */
export class DeviceSource<T extends DeviceType> {
    // Public Members
    /**
     * Observable to handle device input changes per device
     */
    public readonly onInputChangedObservable = new Observable<DeviceSourceEvent<T>>();

    // Private Members
    private readonly _deviceInputSystem: IDeviceInputSystem;

    /**
     * Default Constructor
     * @param deviceInputSystem - Reference to DeviceInputSystem
     * @param deviceType - Type of device
     * @param deviceSlot - "Slot" or index that device is referenced in
     */
    constructor(
        deviceInputSystem: IDeviceInputSystem,
        /** Type of device */
        public readonly deviceType: T,
        /** "Slot" or index that device is referenced in */
        public readonly deviceSlot: number = 0
    ) {
        this._deviceInputSystem = deviceInputSystem;
    }

    /**
     * Get input for specific input
     * @param inputIndex - index of specific input on device
     * @returns Input value from DeviceInputSystem
     */
    public getInput(inputIndex: DeviceInput<T>): number {
        return this._deviceInputSystem.pollInput(this.deviceType, this.deviceSlot, inputIndex);
    }
}
