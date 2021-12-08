import { Engine } from '../Engines/engine';
import { INative } from '../Engines/Native/nativeInterfaces';
import { Observable } from '../Misc/observable';
import { NativeDeviceInputSystemImpl } from './Implementations/nativeDeviceInputSystem';
import { WebDeviceInputSystemImpl } from './Implementations/webDeviceInputSystem';
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

    /** @hidden */
    public static _Create(engine: Engine): DeviceInputSystem {
        // If running in Babylon Native, then defer to the native input system, which has the same public contract
        if (!engine.deviceInputSystem) {
            let selectedDIS;

            if (typeof _native !== 'undefined') {
                selectedDIS = (_native.DeviceInputSystem) ? new NativeDeviceInputSystemImpl(new _native.DeviceInputSystem()) : new NativeDeviceInputSystemImpl();
            }
            else {
                selectedDIS = new WebDeviceInputSystemImpl(engine);
            }

            if (selectedDIS) {
                engine.deviceInputSystem = new DeviceInputSystem(selectedDIS);
            }
        }

        return engine.deviceInputSystem;
    }

    /**
     * DeviceInputSystem constructor
     * @param deviceInputSystem Web or Native implementation of DeviceInputSystem
     */
    constructor(deviceInputSystem: IDeviceInputSystem) {
        this._deviceInputSystem = deviceInputSystem;
        // Adds a callback that reassigns onDeviceConnected's callback to trigger the observable's observers for already connected devices
        this.onDeviceConnectedObservable = new Observable((observer) => {
            this._deviceInputSystem.onDeviceConnected = (deviceType, deviceSlot) => {
                this.onDeviceConnectedObservable.notifyObservers({ deviceType, deviceSlot });
            };
        });
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

    /**
     * Configure events to talk with DeviceInputSystem
     */
    public configureEvents() {
        this._deviceInputSystem.configureEvents();
    }

    /**
     * Checks for current device input value, given an id and input index. Throws exception if requested device not initialized.
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     * @returns Current value of input
     */
    public pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
        return this._deviceInputSystem.pollInput(deviceType, deviceSlot, inputIndex);
    }

    /**
     * Check if there's an instance of device on given DeviceInputSystem
     * @param deviceType Enum specifiying device type
     * @returns
     */
    public isDeviceAvailable(deviceType: DeviceType): boolean {
        return this._deviceInputSystem.isDeviceAvailable(deviceType);
    }

    /**
     * Dispose of DeviceInputSystem sub-elements
     */
    public dispose() {
        this.onDeviceConnectedObservable.clear();
        this.onDeviceDisconnectedObservable.clear();
        this.onInputChangedObservable.clear();
        this._deviceInputSystem.dispose();
    }
}
