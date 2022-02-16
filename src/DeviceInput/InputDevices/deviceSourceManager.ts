import { Engine } from '../../Engines/engine';
import { DeviceType } from './deviceEnums';
import { Nullable } from '../../types';
import { Observable, Observer } from '../../Misc/observable';
import { IDeviceEvent } from './inputInterfaces';
import { DeviceSource } from './deviceSource';
import { InternalDeviceSourceManager } from './internalDeviceSourceManager';
import { IDisposable } from '../../scene';
import { ThinEngine } from '../../Engines/thinEngine';

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
    private _onDisposeObserver: Nullable<Observer<ThinEngine>>;

    private _getDeviceSource: <T extends DeviceType>(deviceType: T, deviceSlot?: number) => Nullable<DeviceSource<T>>;
    private _getDeviceSources: <T extends DeviceType>(deviceType: T) => ReadonlyArray<DeviceSource<T>>;
    private _getDevices: () => ReadonlyArray<DeviceSource<DeviceType>>;

    // Public Functions
    /**
     * Gets a DeviceSource, given a type and slot
     */
    public getDeviceSource<T extends DeviceType>(deviceType: T, deviceSlot?: number): Nullable<DeviceSource<T>> {
        return this._getDeviceSource(deviceType, deviceSlot);
    }

    /**
     * Gets an array of DeviceSource objects for a given device type
     */
    public getDeviceSources<T extends DeviceType>(deviceType: T): ReadonlyArray<DeviceSource<T>> {
        return this._getDeviceSources(deviceType);
    }

    /**
     * Returns a read-only list of all available devices
     */
    public getDevices(): ReadonlyArray<DeviceSource<DeviceType>> {
        return this._getDevices();
    }

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

        this._getDeviceSource = this._engine._deviceSourceManager.getDeviceSource;
        this._getDeviceSources = this._engine._deviceSourceManager.getDeviceSources;
        this._getDevices = this._engine._deviceSourceManager.getDevices;

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
        this.onInputChangedObservable.clear();
        this.onDeviceDisconnectedObservable.clear();
        // Null out function refs
        this._getDeviceSource = () => { return null; };
        this._getDeviceSources = () => { return []; };
        this._getDevices = () => { return []; };
        
        if (this._engine._deviceSourceManager) {
            this._engine._deviceSourceManager.unregisterManager(this);
            if (--this._engine._deviceSourceManager._refCount < 1) {
                this._engine._deviceSourceManager.dispose();
                delete this._engine._deviceSourceManager;
            }
        }
        this._engine.onDisposeObservable.remove(this._onDisposeObserver);
    }
}
