import { DeviceInputSystem, POINTER_DEVICE, KEYBOARD_DEVICE, MOUSE_DEVICE } from '../deviceInputSystem';
import { Engine } from '../../Engines/engine';
import { IDisposable } from '../../scene';
import { DeviceType } from './deviceEnums';
import { Nullable } from '../../types';
import { Observable } from '../../Misc/observable';
import { DeviceInput } from './deviceTypes';

/**
 * Class that handles all input for a specific device
 */
export class DeviceSource<T extends DeviceType> {
    /**
     * Observable to handle device input changes per device
     */
    public readonly onInputChangedObservable = new Observable<{ inputIndex: DeviceInput<T>, previousState: Nullable<number>, currentState: Nullable<number> }>();
    private readonly _deviceInputSystem: DeviceInputSystem;
    private _touchPoints: Array<string>;

    /**
     * Default Constructor
     * @param deviceInputSystem Reference to DeviceInputSystem
     * @param deviceName Name of device to be used by DeviceInputSystem
     * @param deviceType Type of device
     * @param deviceSlot "Slot" or index that device is referenced in
     */
    constructor(deviceInputSystem: DeviceInputSystem,
        /** Name of device to be used by DeviceInputSystem */
        public readonly deviceName: string,
        /** Type of device */
        public readonly deviceType: DeviceType,
        /** "Slot" or index that device is referenced in */
        public readonly deviceSlot: number = 0) {
        this._deviceInputSystem = deviceInputSystem;

        if (deviceType == DeviceType.Touch) {
            this._touchPoints = new Array<string>();
        }
    }

    /**
     * Get input for specific input
     * @param inputIndex index of specific input on device
     * @returns Input value from DeviceInputSystem
     */
    public getInput(inputIndex: DeviceInput<T>): Nullable<number> {
        if (this.deviceType == DeviceType.Touch) {
            return this._deviceInputSystem.pollInput(this._touchPoints[this.deviceSlot], inputIndex);
        }

        return this._deviceInputSystem.pollInput(this.deviceName, inputIndex);
    }

    /**
     * Add specific point to array of touch points (DeviceType.Touch only)
     * @param name Name of Specific Touch Point
     */
    public addTouchPoints(name: string) {
        if (this.deviceType == DeviceType.Touch) {
            this._touchPoints.push(name);
        }
    }

    /**
     * Remove specific point from array of touch points (DeviceType.Touch only)
     * @param name Name of Specific Touch Point
     */
    public removeTouchPoints(name: string) {
        if (this.deviceType == DeviceType.Touch) {
            const touchIndex = this._touchPoints.indexOf(name);
            this._touchPoints.splice(touchIndex, 1);
        }
    }
}

/**
 * Class to keep track of devices
 */
export class DeviceSourceManager implements IDisposable {
    // Public Members
    /**
     * Observable to be triggered when before a device is connected
     */
    public onBeforeDeviceConnectedObservable = new Observable<{ deviceType: DeviceType, deviceSlot: number }>();

    /**
     * Observable to be triggered when before a device is disconnected
     */
    public onBeforeDeviceDisconnectedObservable = new Observable<{ deviceType: DeviceType, deviceSlot: number }>();

    /**
     * Observable to be triggered when after a device is connected
     */
    public onAfterDeviceConnectedObservable = new Observable<{ deviceType: DeviceType, deviceSlot: number }>();

    /**
     * Observable to be triggered when after a device is disconnected
     */
    public onAfterDeviceDisconnectedObservable = new Observable<{ deviceType: DeviceType, deviceSlot: number }>();

    // Private Members
    private _devices: Array<Array<DeviceSource<DeviceType>>>;
    private _firstDevice: Array<number>;
    private _deviceInputSystem: DeviceInputSystem;

    /**
     * Default Constructor
     * @param engine engine to pull input element from
     * @param enableObserveEvents boolean to enable use of observe events
     */
    constructor(engine: Engine, enableObserveEvents: boolean = false) {
        const numberOfDeviceTypes = Object.keys(DeviceType).length / 2;
        this._devices = new Array<Array<DeviceSource<DeviceType>>>(numberOfDeviceTypes);
        this._firstDevice = new Array<number>(numberOfDeviceTypes);
        this._deviceInputSystem = new DeviceInputSystem(engine);

        this._deviceInputSystem.onDeviceConnected = (deviceName) => {
            const deviceType = this._getDeviceType(deviceName);
            const deviceSlot = this._getDeviceSlot(deviceName);

            this.onBeforeDeviceConnectedObservable.notifyObservers({ deviceType, deviceSlot });
            this._addDevice(deviceName);
            this.onAfterDeviceConnectedObservable.notifyObservers({ deviceType, deviceSlot });
        };
        this._deviceInputSystem.onDeviceDisconnected = (deviceName) => {
            const deviceType = this._getDeviceType(deviceName);
            const deviceSlot = this._getDeviceSlot(deviceName);

            this.onBeforeDeviceDisconnectedObservable.notifyObservers({ deviceType, deviceSlot });
            this._removeDevice(deviceName);
            this.onAfterDeviceDisconnectedObservable.notifyObservers({ deviceType, deviceSlot });
        };

        if (!this._deviceInputSystem.onInputChanged && enableObserveEvents) {
            this._deviceInputSystem.onInputChanged = (deviceName, inputIndex, previousState, currentState) => {
                const deviceType = this._getDeviceType(deviceName);
                const deviceSlot = this._getDeviceSlot(deviceName);

                if (deviceType == DeviceType.Keyboard || deviceType == DeviceType.Mouse || deviceType == DeviceType.Touch) {
                    this.getDeviceSource(deviceType, deviceSlot)?.onInputChangedObservable.notifyObservers({ inputIndex, previousState, currentState });
                }
            };
        }
    }

    // Public Functions
    /**
     * Gets a DeviceSource, given a type and slot
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     * @returns DeviceSource object
     */
    public getDeviceSource<T extends DeviceType>(deviceType: T, deviceSlot: number = this._firstDevice[deviceType]): Nullable<DeviceSource<T>> {
        if (!this._devices[deviceType] || this._firstDevice[deviceType] === undefined || this._devices[deviceType][deviceSlot] === undefined) {
            return null;
        }

        return this._devices[deviceType][deviceSlot];
    }

    /**
     * Gets an array of DeviceSource objects for a given device type
     * @param deviceType Enum specifiying device type
     * @returns Array of DeviceSource objects
     */
    public getDeviceSources<T extends DeviceType>(deviceType: T): ReadonlyArray<DeviceSource<T>> {
        return this._devices[deviceType];
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
        const deviceType = this._getDeviceType(deviceName);

        if (!this._devices[deviceType]) {
            this._devices[deviceType] = new Array<DeviceSource<DeviceType>>();

            if (deviceType == DeviceType.Touch) {
                this._devices[deviceType][0] = new DeviceSource<DeviceType>(this._deviceInputSystem, POINTER_DEVICE, DeviceType.Touch, 0);
            }
        }

        // If device is a touch device, update only touch points.  Otherwise, add new device.
        if (deviceType == DeviceType.Touch) {
            this._devices[deviceType][0].addTouchPoints(deviceName);
        }
        else {
            this._devices[deviceType][deviceSlot] = new DeviceSource<DeviceType>(this._deviceInputSystem, deviceName, deviceType, deviceSlot);
        }

        this._updateFirstDevices(deviceType);
    }

    /**
     * Function to remove device name to device list
     * @param deviceName Name of Device
     */
    private _removeDevice(deviceName: string) {
        const deviceSlot = this._getDeviceSlot(deviceName);
        const deviceType = this._getDeviceType(deviceName);

        if (deviceType == DeviceType.Touch) {
            this._devices[deviceType][0].removeTouchPoints(deviceName);
        }
        else {
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
        switch (type) {
            case DeviceType.Keyboard:
            case DeviceType.Mouse:
            case DeviceType.Touch:
                this._firstDevice[type] = 0;
                break;
            case DeviceType.DualShock:
            case DeviceType.Xbox:
            case DeviceType.Switch:
            case DeviceType.Generic:
                const devices = this._devices[type];
                for (let i = 0; i < devices.length; i++) {
                    if (devices[i]) {
                        this._firstDevice[type] = i;
                        break;
                    }
                }
                break;
        }
    }

    /**
     * Gets DeviceType from the device name
     * @param deviceName Name of Device from DeviceInputSystem
     * @returns DeviceType enum value
     */
    private _getDeviceType(deviceName: string): DeviceType {
        if (deviceName == KEYBOARD_DEVICE) {
            return DeviceType.Keyboard;
        }
        else if (deviceName == MOUSE_DEVICE) {
            return DeviceType.Mouse;
        }
        else if (deviceName.indexOf(POINTER_DEVICE) !== -1) {
            return DeviceType.Touch;
        }
        else if (deviceName.indexOf("054c") !== -1) { // DualShock 4 Gamepad
            return DeviceType.DualShock;
        }
        else if (deviceName.indexOf("Xbox One") !== -1 || deviceName.search("Xbox 360") !== -1 || deviceName.search("xinput") !== -1) { // Xbox Gamepad
            return DeviceType.Xbox;
        }
        else if (deviceName.indexOf("057e") !== -1) { // Switch Gamepad
            return DeviceType.Switch;
        }

        return DeviceType.Generic;
    }
}