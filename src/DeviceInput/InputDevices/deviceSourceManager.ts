import { DeviceInputSystem, POINTER_DEVICE, KEYBOARD_DEVICE, MOUSE_DEVICE } from '../deviceInputSystem';
import { Engine } from '../../Engines/engine';
import { IDisposable } from '../../scene';
import { DeviceType, DeviceInputs } from './deviceEnums';
import { Nullable } from '../../types';
import { Observable } from '../../Misc/observable';

/**
 * Class to keep track of devices
 */
export class DeviceSourceManager implements IDisposable {
    // Public Members
    /**
     * Observable to be triggered when before a device is connected
     */
    public onBeforeDeviceConnectedObservable = new Observable<{deviceType: DeviceType, deviceSlot: number}>();

    /**
     * Observable to be triggered when before a device is disconnected
     */
    public onBeforeDeviceDisconnectedObservable = new Observable<{deviceType: DeviceType, deviceSlot: number}>();

    /**
     * Observable to be triggered when after a device is connected
     */
    public onAfterDeviceConnectedObservable = new Observable<{deviceType: DeviceType, deviceSlot: number}>();

    /**
     * Observable to be triggered when after a device is disconnected
     */
    public onAfterDeviceDisconnectedObservable = new Observable<{deviceType: DeviceType, deviceSlot: number}>();

    // Private Members
    private _devices: Array<Array<string>>;
    private _touchPoints: Array<string>;
    private _firstDevice: Array<number>;
    private _deviceInputSystem: DeviceInputSystem;

    /**
     * Default Constructor
     * @param engine - engine to pull input element from
     */
    constructor(engine: Engine) {
        const numberOfDeviceTypes = Object.keys(DeviceType).length / 2;
        this._devices = new Array<Array<string>>(numberOfDeviceTypes);
        this._firstDevice = new Array<number>(numberOfDeviceTypes);
        this._deviceInputSystem = new DeviceInputSystem(engine);

        this._deviceInputSystem.onDeviceConnected = (deviceName) => {
            const deviceType = this._getDeviceTypeFromName(deviceName);
            const deviceSlot = this._getDeviceSlot(deviceName);

            this.onBeforeDeviceConnectedObservable.notifyObservers({deviceType, deviceSlot});
            this._addDevice(deviceName);
            this.onAfterDeviceConnectedObservable.notifyObservers({deviceType, deviceSlot});
        };
        this._deviceInputSystem.onDeviceDisconnected = (deviceName) => {
            const deviceType = this._getDeviceTypeFromName(deviceName);
            const deviceSlot = this._getDeviceSlot(deviceName);

            this.onBeforeDeviceDisconnectedObservable.notifyObservers({deviceType, deviceSlot});
            this._removeDevice(deviceName);
            this.onAfterDeviceDisconnectedObservable.notifyObservers({deviceType, deviceSlot});
        };
    }

    // Public Functions
    /**
     * Checks for current device input value, given DeviceType, slot, and inputIndex
     * @param type Enum specifiying device type
     * @param inputIndex Index of device input
     * @param deviceSlot "Slot" or index that device is referenced in
     * @returns Current value of input
     */
    public getInput<T extends DeviceType>(type: T, inputIndex: DeviceInputs<T>, deviceSlot: number = this._firstDevice[type]): Nullable<number> {
        if (!this._devices[type] || this._firstDevice[type] === undefined)
        {
            return null;
        }
        else if (type == DeviceType.Touch)
        {
            return this._deviceInputSystem.pollInput(this._touchPoints[deviceSlot], inputIndex);
        }

        return this._deviceInputSystem.pollInput(this._devices[type][deviceSlot], inputIndex);
    }

    /**
     * Dispose of DeviceInputSystem and other parts
     */
    public dispose() {
        this._deviceInputSystem.dispose();
    }

    // Private Functions
    /**
     * Function to add device name to device list
     * @param deviceName Name of Device
     */
    private _addDevice(deviceName: string) {
        const deviceSlot = this._getDeviceSlot(deviceName);
        const deviceType = this._getDeviceTypeFromName(deviceName);

        if (!this._devices[deviceType])
        {
            this._devices[deviceType] = new Array<string>();

            if (deviceType == DeviceType.Touch)
            {
                this._touchPoints = new Array<string>();
                this._devices[deviceType][deviceSlot] = POINTER_DEVICE;
            }
        }

        // If device is a touch device, update only touch points.  Otherwise, add new device.
        if (deviceType == DeviceType.Touch)
        {
            this._touchPoints.push(deviceName);
        }
        else
        {
            this._devices[deviceType][deviceSlot] = deviceName;
        }

        this._updateFirstDevices(deviceType);
    }

    /**
     * Function to remove device name to device list
     * @param deviceName Name of Device
     */
    private _removeDevice(deviceName: string) {
        const deviceSlot = this._getDeviceSlot(deviceName);
        const deviceType = this._getDeviceTypeFromName(deviceName);

        if (deviceType == DeviceType.Touch)
        {
            const touchIndex = this._touchPoints.indexOf(deviceName);
            this._touchPoints.splice(touchIndex, 1);
        }
        else
        {
            delete this._devices[deviceType][deviceSlot];
        }
    }

    /**
     * Get slot for a given input
     * @param deviceName Name of Device
     * @returns Slot Number
     */
    private _getDeviceSlot(deviceName: string): number {
        const splitName = deviceName.split("-");
        const deviceSlot = parseInt(splitName[splitName.length - 1]);

        if (deviceSlot) {
            return deviceSlot;
        }

        return 0;
    }

    /**
     * Updates array storing first connected device of each type
     * @param type Type of Device
     */
    private _updateFirstDevices(type: DeviceType) {
        switch (type)
        {
            case DeviceType.Keyboard:
            case DeviceType.Mouse:
            case DeviceType.Touch:
                this._firstDevice[type] = 0;
                break;
            case DeviceType.DualShock:
            case DeviceType.Xbox:
            case DeviceType.Switch:
            case DeviceType.Generic:
                let i = 0;
                let first = -1;

                while (first < 0 && i < this._devices[type].length)
                {
                    if (this._devices[type][i])
                    {
                        first = i;
                    }
                    i++;
                }

                this._firstDevice[type] = first;
                break;
        }
    }

    /**
     * Gets DeviceType from the device name
     * @param deviceName Name of Device from DeviceInputSystem
     * @returns DeviceType enum value
     */
    private _getDeviceTypeFromName(deviceName: string): DeviceType
    {
        if (deviceName == KEYBOARD_DEVICE) {
            return DeviceType.Keyboard;
        }
        else if (deviceName == MOUSE_DEVICE) {
            return DeviceType.Mouse;
        }
        else if (deviceName.search(POINTER_DEVICE) !== -1) {
            return DeviceType.Touch;
        }
        else if (deviceName.search("054c") !== -1) { // DualShock 4 Gamepad
            return DeviceType.DualShock;
        }
        else if (deviceName.search("Xbox One") !== -1 || deviceName.search("Xbox 360") !== -1 || deviceName.search("xinput") !== -1) { // Xbox Gamepad
            return DeviceType.Xbox;
        }
        else if (deviceName.search("057e") !== -1) { // Switch Gamepad
            return DeviceType.Switch;
        }

        return DeviceType.Generic;
    }
}