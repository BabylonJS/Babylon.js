import { DeviceInputSystem } from '../deviceInputSystem';
import { Engine } from '../../Engines/engine';
import { IDisposable } from '../../scene';
import { DeviceType } from './deviceEnums';
import { Nullable } from '../../types';
import { Observable } from '../../Misc/observable';
import { DeviceInput } from './deviceTypes';
import { IDeviceEvent, IDeviceInputSystem } from '../Interfaces/inputInterfaces';

/**
 * Class that handles all input for a specific device
 */
export class DeviceSource<T extends DeviceType> {
    // Public Members
    /**
     * Observable to handle device input changes per device
     */
    public readonly onInputChangedObservable = new Observable<IDeviceEvent>();

    // Private Members
    private readonly _deviceInputSystem: IDeviceInputSystem;

    /**
     * Default Constructor
     * @param deviceInputSystem Reference to DeviceInputSystem
     * @param deviceType Type of device
     * @param deviceSlot "Slot" or index that device is referenced in
     */
    constructor(deviceInputSystem: IDeviceInputSystem,
        /** Type of device */
        public readonly deviceType: DeviceType,
        /** "Slot" or index that device is referenced in */
        public readonly deviceSlot: number = 0) {
        this._deviceInputSystem = deviceInputSystem;
    }

    /**
     * Get input for specific input
     * @param inputIndex index of specific input on device
     * @returns Input value from DeviceInputSystem
     */
    public getInput(inputIndex: DeviceInput<T>): number {
        return this._deviceInputSystem.pollInput(this.deviceType, this.deviceSlot, inputIndex);
    }
}

/**
 * Class to keep track of devices
 */
export class DeviceSourceManager implements IDisposable {
    // Public Members
    /**
     * Observable to be triggered when after a device is connected, any new observers added will be triggered against already connected devices
     */
    public readonly onDeviceConnectedObservable = new Observable<DeviceSource<DeviceType>>((observer) => {
        this.getDevices().forEach((device) => {
            if (device) {
                this.onDeviceConnectedObservable.notifyObserver(observer, device);
            }
        });
    });

    /**
     * Observable to be triggered when after a device is disconnected
     */
    public readonly onDeviceDisconnectedObservable = new Observable<DeviceSource<DeviceType>>();

    // Private Members
    private readonly _devices: Array<Array<DeviceSource<DeviceType>>>;
    private readonly _firstDevice: Array<number>;
    private readonly _deviceInputSystem: IDeviceInputSystem;

    /**
     * Default Constructor
     * @param engine engine to pull input element from
     */
    constructor(engine: Engine) {
        const numberOfDeviceTypes = Object.keys(DeviceType).length / 2;
        this._devices = new Array<Array<DeviceSource<DeviceType>>>(numberOfDeviceTypes);
        this._firstDevice = new Array<number>(numberOfDeviceTypes);
        this._deviceInputSystem = DeviceInputSystem.Create(engine);

        this._deviceInputSystem.onDeviceConnectedObservable.add((eventData) => {
            this._addDevice(eventData.deviceType, eventData.deviceSlot);
            this.onDeviceConnectedObservable.notifyObservers(this.getDeviceSource(eventData.deviceType, eventData.deviceSlot)!);
        });

        this._deviceInputSystem.onDeviceDisconnectedObservable.add((eventData) => {
            const device = this.getDeviceSource(eventData.deviceType, eventData.deviceSlot)!; // Grab local reference to use before removing from devices
            this._removeDevice(eventData.deviceType, eventData.deviceSlot);
            this.onDeviceDisconnectedObservable.notifyObservers(device);
        });

        this._deviceInputSystem.onInputChangedObservable.add((eventData) => {
            this.getDeviceSource(eventData.deviceType, eventData.deviceSlot)?.onInputChangedObservable.notifyObservers(eventData);
        });
    }

    // Public Functions
    /**
     * Gets a DeviceSource, given a type and slot
     * @param deviceType Enum specifying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     * @returns DeviceSource object
     */
    public getDeviceSource<T extends DeviceType>(deviceType: T, deviceSlot?: number): Nullable<DeviceSource<T>> {
        if (deviceSlot === undefined) {
            if (this._firstDevice[deviceType] === undefined) {
                return null;
            }

            deviceSlot = this._firstDevice[deviceType];
        }

        if (!this._devices[deviceType] || this._devices[deviceType][deviceSlot] === undefined) {
            return null;
        }

        return this._devices[deviceType][deviceSlot];
    }

    /**
     * Gets an array of DeviceSource objects for a given device type
     * @param deviceType Enum specifying device type
     * @returns Array of DeviceSource objects
     */
    public getDeviceSources<T extends DeviceType>(deviceType: T): ReadonlyArray<DeviceSource<T>> {
        return this._devices[deviceType].filter((source) => { return !!source; });
    }

    /**
     * Returns a read-only list of all available devices
     * @returns Read-only array with active devices
     */
    public getDevices(): ReadonlyArray<DeviceSource<DeviceType>> {
        const deviceArray = new Array<DeviceSource<DeviceType>>();
        this._devices.forEach((deviceSet) => {
            deviceArray.push.apply(deviceArray, deviceSet);
        });

        return deviceArray;
    }

    /**
     * Dispose of DeviceInputSystem and other parts
     */
    public dispose() {
        this.onDeviceConnectedObservable.clear();
        this.onDeviceDisconnectedObservable.clear();
        this._deviceInputSystem.dispose();
    }

    // Private Functions
    /**
     * Function to add device name to device list
     * @param deviceType Enum specifying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     */
    private _addDevice(deviceType: DeviceType, deviceSlot: number) {
        if (!this._devices[deviceType]) {
            this._devices[deviceType] = new Array<DeviceSource<DeviceType>>();
        }

        if (!this._devices[deviceType][deviceSlot]) {
            this._devices[deviceType][deviceSlot] = new DeviceSource(this._deviceInputSystem, deviceType, deviceSlot);
            this._updateFirstDevices(deviceType);
        }
    }

    /**
     * Function to remove device name to device list
     * @param deviceType Enum specifying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     */
    private _removeDevice(deviceType: DeviceType, deviceSlot: number) {
        if (this._devices[deviceType]?.[deviceSlot]) {
            delete this._devices[deviceType][deviceSlot];
        }
        // Even if we don't delete a device, we should still check for the first device as things may have gotten out of sync.
        this._updateFirstDevices(deviceType);
    }

    /**
     * Updates array storing first connected device of each type
     * @param type Type of Device
     */
    private _updateFirstDevices(type: DeviceType) {
        switch (type) {
            case DeviceType.Keyboard:
            case DeviceType.Mouse:
                this._firstDevice[type] = 0;
                break;
            case DeviceType.Touch:
            case DeviceType.DualShock:
            case DeviceType.Xbox:
            case DeviceType.Switch:
            case DeviceType.Generic:
                delete this._firstDevice[type];
                const devices = this._devices[type];
                if (devices) {
                    for (let i = 0; i < devices.length; i++) {
                        if (devices[i]) {
                            this._firstDevice[type] = i;
                            break;
                        }
                    }
                }
                break;
        }
    }
}
