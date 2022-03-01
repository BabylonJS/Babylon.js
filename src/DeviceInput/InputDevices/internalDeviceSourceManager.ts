import { IDisposable } from '../../scene';
import { DeviceType } from './deviceEnums';
import { Nullable } from '../../types';
import { Observable } from '../../Misc/observable';
import { IDeviceInputSystem } from './inputInterfaces';
import { NativeDeviceInputSystem } from './nativeDeviceInputSystem';
import { WebDeviceInputSystem } from './webDeviceInputSystem';
import { DeviceSource } from './deviceSource';
import { INative } from '../../Engines/Native/nativeInterfaces';
import { Engine } from '../../Engines/engine';
import { IUIEvent } from '../../Events/deviceInputEvents';

declare const _native: INative;

declare module "../../Engines/engine" {
    interface Engine {
        /** @hidden */
        _deviceSourceManager?: InternalDeviceSourceManager;
    }
}

/** @hidden */
export interface IObservableManager {
    onDeviceConnectedObservable: Observable<DeviceSource<DeviceType>>;
    onInputChangedObservable: Observable<IUIEvent>;
    onDeviceDisconnectedObservable: Observable<DeviceSource<DeviceType>>;
}

/** @hidden */
export class InternalDeviceSourceManager implements IDisposable {
    // Private Members
    private readonly _devices: Array<Array<DeviceSource<DeviceType>>>;
    private readonly _firstDevice: Array<number>;
    private readonly _deviceInputSystem: IDeviceInputSystem;

    private readonly _registeredManagers = new Array<IObservableManager>();

    public _refCount = 0;

    public constructor(engine: Engine) {
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
            const deviceSource = this.getDeviceSource(deviceType, deviceSlot)!;
            for (const manager of this._registeredManagers) {
                manager.onDeviceConnectedObservable.notifyObservers(deviceSource);
            }
        };

        this._deviceInputSystem.onDeviceDisconnected = (deviceType, deviceSlot) => {
            const deviceSource = this.getDeviceSource(deviceType, deviceSlot)!; // Grab local reference to use before removing from devices
            this._removeDevice(deviceType, deviceSlot);
            for (const manager of this._registeredManagers) {
                manager.onDeviceDisconnectedObservable.notifyObservers(deviceSource);
            }
        };

        this._deviceInputSystem.onInputChanged = (eventData: IUIEvent) => {
            if (eventData) {
                for (const manager of this._registeredManagers) {
                    manager.onInputChangedObservable.notifyObservers(eventData);
                }

                this._devices[eventData.deviceType][eventData.deviceSlot].onInputChangedObservable.notifyObservers(eventData);
            }
        };
    }

    // Public Functions
    public readonly getDeviceSource = <T extends DeviceType>(deviceType: T, deviceSlot?: number): Nullable<DeviceSource<T>> => {
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

    public readonly getDeviceSources = <T extends DeviceType>(deviceType: T): ReadonlyArray<DeviceSource<T>> => {
        return this._devices[deviceType].filter((source) => { return !!source; });
    }

    public readonly getDevices = (): ReadonlyArray<DeviceSource<DeviceType>> => {
        const deviceArray = new Array<DeviceSource<DeviceType>>();
        this._devices.forEach((deviceSet) => {
            deviceArray.push.apply(deviceArray, deviceSet);
        });

        return deviceArray;
    }

    public readonly registerManager = (manager: IObservableManager): void => {
        this._registeredManagers.push(manager);
    }

    public readonly unregisterManager = (manager: IObservableManager): void => {
        const idx = this._registeredManagers.indexOf(manager);

        if (idx > -1) {
            this._registeredManagers.splice(idx, 1);
        }
    }

    public dispose(): void {
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
            case DeviceType.DualSense:
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
