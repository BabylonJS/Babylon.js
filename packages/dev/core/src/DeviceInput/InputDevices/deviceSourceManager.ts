import type { Engine } from "../../Engines/engine";
import { DeviceType } from "./deviceEnums";
import type { Nullable } from "../../types";
import type { Observer } from "../../Misc/observable";
import { Observable } from "../../Misc/observable";
import type { DeviceSource } from "./deviceSource";
import type { IObservableManager, DeviceSourceType } from "../internalDeviceSourceManager";
import { InternalDeviceSourceManager } from "../internalDeviceSourceManager";
import type { IDisposable } from "../../scene";
import type { ThinEngine } from "../../Engines/thinEngine";
import type { IKeyboardEvent, IPointerEvent, IUIEvent, IWheelEvent } from "../../Events/deviceInputEvents";

/**
 * Class to keep track of devices
 */
export class DeviceSourceManager implements IDisposable, IObservableManager {
    // Public Members
    /**
     * Observable to be triggered when after a device is connected, any new observers added will be triggered against already connected devices
     */
    public readonly onDeviceConnectedObservable: Observable<DeviceSourceType>;

    /**
     * Observable to be triggered when after a device is disconnected
     */
    public readonly onDeviceDisconnectedObservable: Observable<DeviceSourceType>;

    // Private Members
    private _engine: Engine;
    private _onDisposeObserver: Nullable<Observer<ThinEngine>>;
    private readonly _devices: Array<Array<DeviceSource<DeviceType>>>;
    private readonly _firstDevice: Array<number>;

    // Public Functions
    /**
     * Gets a DeviceSource, given a type and slot
     * @param deviceType - Type of Device
     * @param deviceSlot - Slot or ID of device
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

        return this._devices[deviceType][deviceSlot] as DeviceSource<T>;
    }
    /**
     * Gets an array of DeviceSource objects for a given device type
     * @param deviceType - Type of Device
     * @returns All available DeviceSources of a given type
     */
    public getDeviceSources<T extends DeviceType>(deviceType: T): ReadonlyArray<DeviceSource<T>> {
        // If device type hasn't had any devices connected yet, return empty array.
        if (!this._devices[deviceType]) {
            return [];
        }
        return this._devices[deviceType].filter((source) => {
            return !!source;
        }) as Array<DeviceSource<T>>;
    }

    /**
     * Default constructor
     * @param engine - Used to get canvas (if applicable)
     */
    constructor(engine: Engine) {
        const numberOfDeviceTypes = Object.keys(DeviceType).length / 2;
        this._devices = new Array(numberOfDeviceTypes);
        this._firstDevice = new Array(numberOfDeviceTypes);
        this._engine = engine;

        if (!this._engine._deviceSourceManager) {
            this._engine._deviceSourceManager = new InternalDeviceSourceManager(engine);
        }
        this._engine._deviceSourceManager._refCount++;

        // Observables
        this.onDeviceConnectedObservable = new Observable((observer) => {
            for (const devices of this._devices) {
                if (devices) {
                    for (const device of devices) {
                        if (device) {
                            this.onDeviceConnectedObservable.notifyObserver(observer, device as DeviceSourceType);
                        }
                    }
                }
            }
        });
        this.onDeviceDisconnectedObservable = new Observable();

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
    /**
     * @param deviceSource - Source to add
     * @internal
     */
    public _addDevice(deviceSource: DeviceSourceType): void {
        if (!this._devices[deviceSource.deviceType]) {
            this._devices[deviceSource.deviceType] = new Array();
        }

        if (!this._devices[deviceSource.deviceType][deviceSource.deviceSlot]) {
            this._devices[deviceSource.deviceType][deviceSource.deviceSlot] = deviceSource;
            this._updateFirstDevices(deviceSource.deviceType);
        }

        this.onDeviceConnectedObservable.notifyObservers(deviceSource);
    }

    /**
     * @param deviceType - DeviceType
     * @param deviceSlot - DeviceSlot
     * @internal
     */
    public _removeDevice(deviceType: DeviceType, deviceSlot: number): void {
        const deviceSource = this._devices[deviceType]?.[deviceSlot]; // Grab local reference to use before removing from devices
        this.onDeviceDisconnectedObservable.notifyObservers(deviceSource as DeviceSourceType);
        if (this._devices[deviceType]?.[deviceSlot]) {
            delete this._devices[deviceType][deviceSlot];
        }
        // Even if we don't delete a device, we should still check for the first device as things may have gotten out of sync.
        this._updateFirstDevices(deviceType);
    }

    /**
     * @param deviceType - DeviceType
     * @param deviceSlot - DeviceSlot
     * @param eventData - Event
     * @internal
     */
    public _onInputChanged<T extends DeviceType>(deviceType: T, deviceSlot: number, eventData: IUIEvent): void {
        this._devices[deviceType]?.[deviceSlot]?.onInputChangedObservable.notifyObservers(eventData as IKeyboardEvent | IWheelEvent | IPointerEvent);
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
            case DeviceType.Generic: {
                delete this._firstDevice[type];
                // eslint-disable-next-line no-case-declarations
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
}
