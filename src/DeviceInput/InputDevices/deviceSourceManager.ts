import { Engine } from '../../Engines/engine';
import { DeviceType } from './deviceEnums';
import { Nullable } from '../../types';
import { Observable } from '../../Misc/observable';
import { IDeviceEvent } from './inputInterfaces';
import { DeviceSource } from './deviceSource';
import { InternalDeviceSourceManager } from './internalDeviceSourceManager';

/**
 * Class to keep track of devices
 */
export class DeviceSourceManager {
    // Public Members
    /**
     * Observable to be triggered when after a device is connected, any new observers added will be triggered against already connected devices
     */
    public readonly onDeviceConnectedObservable: Observable<DeviceSource<DeviceType>>;
    /**
     * Observable to be triggered when a device's input is changed
     */
    public readonly onInputChangedObservable: Observable<IDeviceEvent>;
    /**
     * Observable to be triggered when after a device is disconnected
     */
    public readonly onDeviceDisconnectedObservable: Observable<DeviceSource<DeviceType>>;

    // Private Members
    private _deviceSourceManager: InternalDeviceSourceManager;

    // Public Functions
    /**
     * Gets a DeviceSource, given a type and slot
     */
    public getDeviceSource: <T extends DeviceType>(deviceType: T, deviceSlot?: number) => Nullable<DeviceSource<T>>;

    /**
     * Gets an array of DeviceSource objects for a given device type
     */
    public getDeviceSources: <T extends DeviceType>(deviceType: T) => ReadonlyArray<DeviceSource<T>>;

    /**
     * Returns a read-only list of all available devices
     */
    public getDevices: () => ReadonlyArray<DeviceSource<DeviceType>>;

    /**
     * Default constructor
     * @param engine Used to get canvas (if applicable)
     */
    constructor(engine: Engine) {
        this._deviceSourceManager = InternalDeviceSourceManager._Create(engine);

        this.onDeviceConnectedObservable = this._deviceSourceManager.onDeviceConnectedObservable;
        this.onInputChangedObservable = this._deviceSourceManager.onInputChangedObservable;
        this.onDeviceDisconnectedObservable = this._deviceSourceManager.onDeviceDisconnectedObservable;
        this.getDeviceSource = this._deviceSourceManager.getDeviceSource;
        this.getDeviceSources = this._deviceSourceManager.getDeviceSources;
        this.getDevices = this._deviceSourceManager.getDevices;
    }
}
