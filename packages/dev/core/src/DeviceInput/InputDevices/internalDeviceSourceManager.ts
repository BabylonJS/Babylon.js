import type { IDisposable } from "../../scene";
import { DeviceType } from "./deviceEnums";
import type { Observable } from "../../Misc/observable";
import type { IDeviceInputSystem } from "./inputInterfaces";
import { NativeDeviceInputSystem } from "./nativeDeviceInputSystem";
import { WebDeviceInputSystem } from "./webDeviceInputSystem";
import { DeviceSource } from "./deviceSource";
import type { INative } from "../../Engines/Native/nativeInterfaces";
import type { Engine } from "../../Engines/engine";
import type { IUIEvent } from "../../Events/deviceInputEvents";

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
    onDeviceDisconnectedObservable: Observable<DeviceSource<DeviceType>>;

    // Functions
    _onInputChanged(deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent): void;
    _addDevice(deviceSource: DeviceSource<DeviceType>): void;
    _removeDevice(deviceType: DeviceType, deviceSlot: number): void;
}

/** @hidden */
export class InternalDeviceSourceManager implements IDisposable {
    // Private Members
    // This is a master list of all device type/slot combos
    private readonly _devices: Array<Array<number>>;

    private readonly _deviceInputSystem: IDeviceInputSystem;

    private readonly _registeredManagers = new Array<IObservableManager>();

    public _refCount = 0;

    public constructor(engine: Engine) {
        const numberOfDeviceTypes = Object.keys(DeviceType).length / 2;
        this._devices = new Array<Array<number>>(numberOfDeviceTypes);

        const onDeviceConnected = (deviceType: DeviceType, deviceSlot: number) => {
            if (!this._devices[deviceType]) {
                this._devices[deviceType] = new Array<number>();
            }

            if (!this._devices[deviceType][deviceSlot]) {
                this._devices[deviceType][deviceSlot] = deviceSlot;
            }
            for (const manager of this._registeredManagers) {
                const deviceSource = new DeviceSource(this._deviceInputSystem, deviceType, deviceSlot);
                manager._addDevice(deviceSource);
            }
        };

        const onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => {
            if (this._devices[deviceType]?.[deviceSlot]) {
                delete this._devices[deviceType][deviceSlot];
            }
            for (const manager of this._registeredManagers) {
                manager._removeDevice(deviceType, deviceSlot);
            }
        };

        const onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => {
            if (eventData) {
                for (const manager of this._registeredManagers) {
                    manager._onInputChanged(deviceType, deviceSlot, eventData);
                }
            }
        };

        if (typeof _native !== "undefined") {
            this._deviceInputSystem = new NativeDeviceInputSystem(onDeviceConnected, onDeviceDisconnected, onInputChanged);
        } else {
            this._deviceInputSystem = new WebDeviceInputSystem(engine, onDeviceConnected, onDeviceDisconnected, onInputChanged);
        }
    }

    // Public Functions
    public readonly registerManager = (manager: IObservableManager): void => {
        for (let deviceType = 0; deviceType < this._devices.length; deviceType++) {
            const device = this._devices[deviceType];
            for (const deviceSlotKey in device) {
                const deviceSlot = +deviceSlotKey;
                manager._addDevice(new DeviceSource(this._deviceInputSystem, deviceType, deviceSlot));
            }
        }
        this._registeredManagers.push(manager);
    };

    public readonly unregisterManager = (manager: IObservableManager): void => {
        const idx = this._registeredManagers.indexOf(manager);

        if (idx > -1) {
            this._registeredManagers.splice(idx, 1);
        }
    };

    public dispose(): void {
        this._deviceInputSystem.dispose();
    }
}
