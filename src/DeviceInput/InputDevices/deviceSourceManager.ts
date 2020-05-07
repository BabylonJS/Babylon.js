import { DeviceInputSystem } from '../deviceInputSystem';
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
    public readonly onInputChangedObservable = new Observable<{ inputIndex: number, previousState: Nullable<number>, currentState: Nullable<number> }>();
    private readonly _deviceInputSystem: DeviceInputSystem;
    private _touchPoints: Array<number>;

    /**
     * Default Constructor
     * @param deviceInputSystem Reference to DeviceInputSystem
     * @param deviceName Name of device to be used by DeviceInputSystem
     * @param deviceType Type of device
     * @param deviceSlot "Slot" or index that device is referenced in
     */
    constructor(deviceInputSystem: DeviceInputSystem,
        /** Type of device */
        public readonly deviceType: DeviceType,
        /** "Slot" or index that device is referenced in */
        public readonly deviceSlot: number = 0) {
        this._deviceInputSystem = deviceInputSystem;

        if (deviceType == DeviceType.Touch) {
            this._touchPoints = new Array<number>();
        }
    }

    /**
     * Get input for specific input
     * @param inputIndex index of specific input on device
     * @returns Input value from DeviceInputSystem
     */
    public getInput(inputIndex: DeviceInput<T>): Nullable<number> {
        if (this.deviceType == DeviceType.Touch) {
            return this._deviceInputSystem.pollInput(this.deviceType, this._touchPoints[this.deviceSlot], inputIndex);
        }

        return this._deviceInputSystem.pollInput(this.deviceType, this.deviceSlot, inputIndex);
    }

    /**
     * Add specific point to array of touch points (DeviceType.Touch only)
     * @param name Name of Specific Touch Point
     */
    public addTouchPoints(slot: number) {
        if (this.deviceType == DeviceType.Touch) {
            this._touchPoints.push(slot);
        }
    }

    /**
     * Remove specific point from array of touch points (DeviceType.Touch only)
     * @param name Name of Specific Touch Point
     */
    public removeTouchPoints(slot: number) {
        if (this.deviceType == DeviceType.Touch) {
            const touchIndex = this._touchPoints.indexOf(slot);
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

        this._deviceInputSystem.onDeviceConnected = (deviceType, deviceSlot) => {
            this.onBeforeDeviceConnectedObservable.notifyObservers({ deviceType, deviceSlot });
            this._addDevice(deviceType, deviceSlot);
            this.onAfterDeviceConnectedObservable.notifyObservers({ deviceType, deviceSlot });
        };
        this._deviceInputSystem.onDeviceDisconnected = (deviceType, deviceSlot) => {
            this.onBeforeDeviceDisconnectedObservable.notifyObservers({ deviceType, deviceSlot });
            this._removeDevice(deviceType, deviceSlot);
            this.onAfterDeviceDisconnectedObservable.notifyObservers({ deviceType, deviceSlot });
        };

        if (!this._deviceInputSystem.onInputChanged && enableObserveEvents) {
            this._deviceInputSystem.onInputChanged = (deviceType, deviceSlot, inputIndex, previousState, currentState) => {
                this.getDeviceSource(deviceType, deviceSlot)?.onInputChangedObservable.notifyObservers({ inputIndex, previousState, currentState });
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
    public getDeviceSource<T extends DeviceType>(deviceType: DeviceType, deviceSlot: number = this._firstDevice[deviceType]): Nullable<DeviceSource<T>> {
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
    public getDeviceSources<T extends DeviceType>(deviceType: DeviceType): ReadonlyArray<DeviceSource<T>> {
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
    private _addDevice<T extends DeviceType>(deviceType: DeviceType, deviceSlot: number) {
        if (!this._devices[deviceType]) {
            this._devices[deviceType] = new Array<DeviceSource<T>>();

            if (deviceType == DeviceType.Touch) {
                this._devices[deviceType][0] = new DeviceSource<T>(this._deviceInputSystem, deviceType, 0);
            }
        }

        // If device is a touch device, update only touch points.  Otherwise, add new device.
        if (deviceType == DeviceType.Touch) {
            this._devices[deviceType][0].addTouchPoints(deviceSlot);
        }
        else {
            this._devices[deviceType][deviceSlot] = new DeviceSource(this._deviceInputSystem, deviceType, deviceSlot);
        }

        this._updateFirstDevices(deviceType);
    }

    /**
     * Function to remove device name to device list
     * @param deviceName Name of Device
     */
    private _removeDevice(deviceType: DeviceType, deviceSlot: number) {
        if (deviceType == DeviceType.Touch) {
            this._devices[deviceType][0].removeTouchPoints(deviceSlot);
        }
        else {
            delete this._devices[deviceType][deviceSlot];
            this._updateFirstDevices(deviceType);
        }
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
                delete this._firstDevice[type];
                for (let i = 0; i < devices.length; i++) {
                    if (devices[i]) {
                        this._firstDevice[type] = i;
                        break;
                    }
                }
                break;
        }
    }
}