import { Engine } from '../../Engines/engine';
import { IDisposable } from '../../scene';
import { DeviceType } from './deviceEnums';
import { Nullable } from '../../types';
import { Observable, Observer } from '../../Misc/observable';
import { IDeviceEvent, IDeviceInputSystem } from './inputInterfaces';
import { NativeDeviceInputSystem } from './nativeDeviceInputSystem';
import { WebDeviceInputSystem } from './webDeviceInputSystem';
import { DeviceSource } from './deviceSource';
import { INative } from '../../Engines/Native/nativeInterfaces';

declare const _native: INative;

/** @hidden */
export class InternalDeviceSourceManager implements IDisposable {
    // Public Members
    public readonly onDeviceConnectedObservable = new Observable<DeviceSource<DeviceType>>((observer) => {
        this.getDevices().forEach((device) => {
            if (device) {
                this.onDeviceConnectedObservable.notifyObserver(observer, device);
            }
        });
    });

    public readonly onInputChangedObservable = new Observable<IDeviceEvent>();

    public readonly onDeviceDisconnectedObservable = new Observable<DeviceSource<DeviceType>>();

    // Private Members
    private readonly _devices: Array<Array<DeviceSource<DeviceType>>>;
    private readonly _firstDevice: Array<number>;
    private readonly _deviceInputSystem: IDeviceInputSystem;

    private _oninputChangedObserver: Nullable<Observer<IDeviceEvent>>;

    public static _Create(engine: Engine): InternalDeviceSourceManager {
        if (!engine._deviceSourceManager) {
            engine._deviceSourceManager = new InternalDeviceSourceManager(engine);
        }
        return engine._deviceSourceManager;
    }

    private constructor(engine: Engine) {
        const numberOfDeviceTypes = Object.keys(DeviceType).length / 2;
        this._devices = new Array<Array<DeviceSource<DeviceType>>>(numberOfDeviceTypes);
        this._firstDevice = new Array<number>(numberOfDeviceTypes);

        if (typeof _native !== 'undefined') {
            this._deviceInputSystem = (_native.DeviceInputSystem) ? new NativeDeviceInputSystem(new _native.DeviceInputSystem()) : new NativeDeviceInputSystem();
        }
        else {
            this._deviceInputSystem = new WebDeviceInputSystem(engine);
        }

        this._deviceInputSystem.onDeviceConnected = (deviceType, deviceSlot) => {
            this._addDevice(deviceType, deviceSlot);
            this.onDeviceConnectedObservable.notifyObservers(this.getDeviceSource(deviceType, deviceSlot)!);
        };

        this._deviceInputSystem.onDeviceDisconnected = (deviceType, deviceSlot) => {
            const device = this.getDeviceSource(deviceType, deviceSlot)!; // Grab local reference to use before removing from devices
            this._removeDevice(deviceType, deviceSlot);
            this.onDeviceDisconnectedObservable.notifyObservers(device);
        };

        this._deviceInputSystem.onInputChanged = (deviceEvent) => {
            this.onInputChangedObservable.notifyObservers(deviceEvent);
        };
    }

    // Public Functions
    public getDeviceSource = <T extends DeviceType>(deviceType: T, deviceSlot?: number): Nullable<DeviceSource<T>> => {
        if (deviceSlot === undefined) {
            if (this._firstDevice[deviceType] === undefined) {
                return null;
            }

            deviceSlot = this._firstDevice[deviceType];
        }

        if (!this._devices[deviceType] || this._devices[deviceType][deviceSlot] === undefined) {
            return null;
        }

        if (!this._oninputChangedObserver) {
            this._oninputChangedObserver = this.onInputChangedObservable.add((eventData) => {
                this._devices[eventData.deviceType][eventData.deviceSlot].onInputChangedObservable.notifyObservers(eventData);
            });
        }

        return this._devices[deviceType][deviceSlot];
    }

    public getDeviceSources = <T extends DeviceType>(deviceType: T): ReadonlyArray<DeviceSource<T>> => {
        return this._devices[deviceType].filter((source) => { return !!source; });
    }

    public getDevices = (): ReadonlyArray<DeviceSource<DeviceType>> => {
        const deviceArray = new Array<DeviceSource<DeviceType>>();
        this._devices.forEach((deviceSet) => {
            deviceArray.push.apply(deviceArray, deviceSet);
        });

        return deviceArray;
    }

    public dispose(): void {
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
    private _addDevice(deviceType: DeviceType, deviceSlot: number): void {
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
    private _removeDevice(deviceType: DeviceType, deviceSlot: number): void {
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
    private _updateFirstDevices(type: DeviceType): void {
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
