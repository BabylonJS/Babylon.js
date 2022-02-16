import { Engine } from '../../Engines/engine';
import { DeviceType } from './deviceEnums';
import { Nullable } from '../../types';
import { Observable } from '../../Misc/observable';
import { IDeviceEvent } from './inputInterfaces';
import { DeviceSource } from './deviceSource';
import { InternalDeviceSourceManager } from './internalDeviceSourceManager';
import { IDisposable } from '../../scene';

/**
 * Class to keep track of devices
 */
export class DeviceSourceManager implements IDisposable {
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
    private _engine: Engine;

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
        this.onInputChangedObservable = new Observable<IDeviceEvent>();
        this.onDeviceDisconnectedObservable = new Observable<DeviceSource<DeviceType>>();

        this._engine._deviceSourceManager.registerManager(this);

        this.getDeviceSource = this._engine._deviceSourceManager.getDeviceSource;
        this.getDeviceSources = this._engine._deviceSourceManager.getDeviceSources;
        this.getDevices = this._engine._deviceSourceManager.getDevices;

        engine.onDisposeObservable.add(() => {
            this.dispose();
        });
    }

    /**
     * Dispose of DeviceSourceManager
     */
    public dispose(): void {
        // Null out observable refs
        this._engine._deviceSourceManager?.unregisterManager(this);
        this.onDeviceConnectedObservable.clear();
        this.onInputChangedObservable.clear();
        this.onDeviceDisconnectedObservable.clear();
        // Null out function refs
        this.getDeviceSource = () => { return null; };
        this.getDeviceSources = () => { return []; };
        this.getDevices = () => { return []; };

        if (this._engine._deviceSourceManager && --this._engine._deviceSourceManager._refCount < 1) {
            this._engine._deviceSourceManager.dispose();
            delete this._engine._deviceSourceManager;
        }
    }
}
