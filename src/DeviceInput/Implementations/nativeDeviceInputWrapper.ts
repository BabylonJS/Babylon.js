import { Observable } from "../../Misc/observable";
import { DeviceEventFactory } from "../Helpers/eventFactory";
import { DeviceType } from "../InputDevices/deviceEnums";
import { IDeviceEvent, IDeviceInputSystem, INativeInput } from "../Interfaces/inputInterfaces";

/** @hidden */
export class NativeDeviceInputWrapper implements IDeviceInputSystem {
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

    private _nativeInput: INativeInput;

    public constructor(nativeInput: INativeInput) {
        this._nativeInput = nativeInput;
        this.onDeviceConnectedObservable = new Observable<{ deviceType: DeviceType; deviceSlot: number; }>();
        this.onDeviceDisconnectedObservable = new Observable<{ deviceType: DeviceType; deviceSlot: number; }>();
        this.onInputChangedObservable = new Observable<IDeviceEvent>();

        this._nativeInput.onDeviceConnected = (deviceType, deviceSlot) => {
            this.onDeviceConnectedObservable.notifyObservers({ deviceType, deviceSlot });
        };

        this._nativeInput.onDeviceDisconnected = (deviceType, deviceSlot) => {
            this.onDeviceDisconnectedObservable.notifyObservers({ deviceType, deviceSlot });
        };

        this._nativeInput.onInputChanged = (deviceType, deviceSlot, inputIndex, previousState, currentState, eventData) => {
            const evt = DeviceEventFactory.CreateDeviceEvent(deviceType, deviceSlot, inputIndex, currentState, this);

            let deviceEvent = evt as IDeviceEvent;
            deviceEvent.deviceType = deviceType;
            deviceEvent.deviceSlot = deviceSlot;
            deviceEvent.inputIndex = inputIndex;
            deviceEvent.previousState = previousState;
            deviceEvent.currentState = currentState;

            this.onInputChangedObservable.notifyObservers(deviceEvent);
        };
    }

    // Public functions
    /**
     * Checks for current device input value, given an id and input index. Throws exception if requested device not initialized.
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     * @returns Current value of input
     */
    public pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
        return this._nativeInput.pollInput(deviceType, deviceSlot, inputIndex);
    }

    /**
     * Check for a specific device in the DeviceInputSystem
     * @param deviceType Type of device to check for
     * @returns bool with status of device's existence
     */
    public isDeviceAvailable(deviceType: DeviceType) {
        //TODO: FIx native side first
        return (deviceType === DeviceType.Mouse || deviceType === DeviceType.Touch);
    }

    /**
     * Dispose of all the observables
     */
    public dispose(): void {
        this.onDeviceConnectedObservable.clear();
        this.onDeviceDisconnectedObservable.clear();
        this.onInputChangedObservable.clear();
    }
}