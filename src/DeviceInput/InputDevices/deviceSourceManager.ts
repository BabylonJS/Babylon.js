import { Engine } from '../../Engines/engine';
import { DeviceType } from './deviceEnums';
import { Nullable } from '../../types';
import { Observable, Observer } from '../../Misc/observable';
import { DeviceSource } from './deviceSource';
import { InternalDeviceSourceManager, IObservableManager } from './internalDeviceSourceManager';
import { IDisposable } from '../../scene';
import { ThinEngine } from '../../Engines/thinEngine';
import { IUIEvent } from '../../Events/deviceInputEvents';

/**
 * Class to keep track of devices
 */
export class DeviceSourceManager implements IDisposable, IObservableManager {
    // Public Members
    /**
     * Observable to be triggered when after a device is connected, any new observers added will be triggered against already connected devices
     */
    public readonly onDeviceConnectedObservable: Observable<DeviceSource<DeviceType>>;

    /**
     * Observable to be triggered when after a device is disconnected
     */
    public readonly onDeviceDisconnectedObservable: Observable<DeviceSource<DeviceType>>;

    // Private Members
    private _engine: Engine;
    private _onDisposeObserver: Nullable<Observer<ThinEngine>>;
    private readonly _devices: Array<Array<DeviceSource<DeviceType>>>;
    private readonly _firstDevice: Array<number>;

    // Public Functions
    /**
     * Gets a DeviceSource, given a type and slot
     * @param deviceType Type of Device
     * @param deviceSlot Slot or ID of device
     * @returns DeviceSource
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
     * @param deviceType Type of Device
     * @returns All available DeviceSources of a given type
     */
    public getDeviceSources<T extends DeviceType>(deviceType: T): ReadonlyArray<DeviceSource<T>> {
        return this._devices[deviceType].filter((source) => { return !!source; });
    }

    /**
     * Returns a read-only list of all available devices
     * @returns All available DeviceSources
     */
    public getDevices(): ReadonlyArray<DeviceSource<DeviceType>> {
        const deviceArray = new Array<DeviceSource<DeviceType>>();
        for (const deviceSet of this._devices) {
            deviceArray.push.apply(deviceArray, deviceSet);
        }

        return deviceArray;
    }

    /**
     * Default constructor
     * @param engine Used to get canvas (if applicable)
     */
    constructor(engine: Engine) {
        const numberOfDeviceTypes = Object.keys(DeviceType).length / 2;
        this._devices = new Array<Array<DeviceSource<DeviceType>>>(numberOfDeviceTypes);
        this._firstDevice = new Array<number>(numberOfDeviceTypes);
        this._engine = engine;

        if (!this._engine._deviceSourceManager) {
            this._engine._deviceSourceManager = new InternalDeviceSourceManager(engine);
        }
        this._engine._deviceSourceManager._refCount++;

        // Observables
        this.onDeviceConnectedObservable = new Observable<DeviceSource<DeviceType>>((observer) => {
            this.getDevices().forEach((device) => {
                this.onDeviceConnectedObservable.notifyObserver(observer, device);
            });
        });
        this.onDeviceDisconnectedObservable = new Observable<DeviceSource<DeviceType>>();

        this._engine._deviceSourceManager.registerManager(this);

        this._onDisposeObserver = engine.onDisposeObservable.add(() => {
            this.dispose();
        });
    }

    /**
     * Dispose of DeviceSourceManager
     */
    public dispose(): void {
        // Null out observable refs
        this.onDeviceConnectedObservable.clear();
        this.onDeviceDisconnectedObservable.clear();

        if (this._engine._deviceSourceManager) {
            this._engine._deviceSourceManager.unregisterManager(this);
            if (--this._engine._deviceSourceManager._refCount < 1) {
                this._engine._deviceSourceManager.dispose();
                delete this._engine._deviceSourceManager;
            }
        }
        this._engine.onDisposeObservable.remove(this._onDisposeObserver);
    }

    // Hidden Functions
    /** @hidden */
    public _addDevice(deviceSource: DeviceSource<DeviceType>): void {
        if (!this._devices[deviceSource.deviceType]) {
            this._devices[deviceSource.deviceType] = new Array<DeviceSource<DeviceType>>();
        }

        if (!this._devices[deviceSource.deviceType][deviceSource.deviceSlot]) {
            this._devices[deviceSource.deviceType][deviceSource.deviceSlot] = deviceSource;
            this._updateFirstDevices(deviceSource.deviceType);
        }

        this.onDeviceConnectedObservable.notifyObservers(deviceSource);
    }

    /** @hidden */
    public _removeDevice(deviceType: DeviceType, deviceSlot: number): void {
        const deviceSource = this._devices[deviceType]?.[deviceSlot]; // Grab local reference to use before removing from devices
        this.onDeviceDisconnectedObservable.notifyObservers(deviceSource);
        if (this._devices[deviceType]?.[deviceSlot]) {
            delete this._devices[deviceType][deviceSlot];
        }
        // Even if we don't delete a device, we should still check for the first device as things may have gotten out of sync.
        this._updateFirstDevices(deviceType);
    }

    /** @hidden */
    public _onInputChanged(deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent): void {
        this._devices[deviceType][deviceSlot]?.onInputChangedObservable.notifyObservers(eventData);
    }

    // Private Functions
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
