import { Engine } from '../Engines/engine';
import { INative } from '../Engines/Native/nativeInterfaces';
import { Observable } from '../Misc/observable';
import { NativeDeviceInputSystem } from './Implementations/nativeDeviceInputSystem';
import { WebDeviceInputSystem } from './Implementations/webDeviceInputSystem';
import { DeviceType } from './InputDevices/deviceEnums';
import { IDeviceEvent, IDeviceInputSystem } from './Interfaces/inputInterfaces';

declare const _native: INative;

/**
 * This class will take all inputs from Keyboard, Pointer, and
 * any Gamepads and provide a polling system that all devices
 * will use.  This class assumes that there will only be one
 * pointer device and one keyboard.
 */
export class DeviceInputSystem {
    // Observables
    /**
     * Observable for devices being connected
     */
    public readonly onDeviceConnectedObservable: Observable<{ deviceType: DeviceType; deviceSlot: number; }>;
    /**
     * Observable for devices being disconnected
     */
    public readonly onDeviceDisconnectedObservable: Observable<{ deviceType: DeviceType; deviceSlot: number; }>;
    /**
     * Observable for changes to device input
     */
    public readonly onInputChangedObservable: Observable<IDeviceEvent>;

    private _deviceInputSystem: IDeviceInputSystem;
    /**
     * Creates a new DeviceInputSystem instance or returns existing one in engine
     * @param engine Engine to assign input system to
     * @returns The new instance
     */
    public static Create(engine: Engine): DeviceInputSystem {
        // If running in Babylon Native, then defer to the native input system, which has the same public contract
        if (!engine.deviceInputSystem) {
            if (typeof _native !== 'undefined') {
                engine.deviceInputSystem = new DeviceInputSystem((_native.DeviceInputSystem) ? new NativeDeviceInputSystem(new _native.DeviceInputSystem()) : new NativeDeviceInputSystem());
            }
            else {
                engine.deviceInputSystem = new DeviceInputSystem(new WebDeviceInputSystem(engine));
            }
        }

        return engine.deviceInputSystem;
    }

    constructor(deviceInputSystem: IDeviceInputSystem) {
        this._deviceInputSystem = deviceInputSystem;
        this.onDeviceConnectedObservable = new Observable();
        this.onDeviceDisconnectedObservable = new Observable();
        this.onInputChangedObservable = new Observable<IDeviceEvent>();

        this._deviceInputSystem.onDeviceConnected = (deviceType, deviceSlot) => {
            this.onDeviceConnectedObservable.notifyObservers({ deviceType, deviceSlot });
        };

        this._deviceInputSystem.onDeviceDisconnected = (deviceType, deviceSlot) => {
            this.onDeviceDisconnectedObservable.notifyObservers({ deviceType, deviceSlot });
        };

        this._deviceInputSystem.onInputChanged = (deviceEvent) => {
            this.onInputChangedObservable.notifyObservers(deviceEvent);
        };
    }

    public configureEvents() {
        this._deviceInputSystem.configureEvents();
    }

    public pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
        return this._deviceInputSystem.pollInput(deviceType, deviceSlot, inputIndex);
    }

    public isDeviceAvailable(deviceType: DeviceType): boolean {
        return this._deviceInputSystem.isDeviceAvailable(deviceType);
    }

    public dispose() {
        this.onDeviceConnectedObservable.clear();
        this.onDeviceDisconnectedObservable.clear();
        this.onInputChangedObservable.clear();
        this._deviceInputSystem.dispose();
    }
}
