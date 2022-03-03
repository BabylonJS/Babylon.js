import { Nullable } from "../../types";
import { DeviceEventFactory } from "../Helpers/eventFactory";
import { DeviceType, PointerInput } from "./deviceEnums";
import { IDeviceEvent, IDeviceInputSystem, INativeInput } from "./inputInterfaces";

/** @hidden */
enum NativePointerInput {
    /** Horizontal Axis */
    Horizontal = PointerInput.Horizontal,
    /** Vertical Axis */
    Vertical = 1,
    /** Left Click or Touch */
    LeftClick = 2,
    /** Middle Click */
    MiddleClick = 3,
    /** Right Click */
    RightClick = 4,
    /** Browser Back */
    BrowserBack = 5,
    /** Browser Forward */
    BrowserForward = 6,
    /** Mouse Wheel X */
    MouseWheelX = 7,
    /** Mouse Wheel Y */
    MouseWheelY = 8,
    /** Mouse Wheel Z */
    MouseWheelZ = 9,
    /** Delta X */
    DeltaHorizontal = 10,
    /** Delta Y */
    DeltaVertical = 11,
}

/** @hidden */
export class NativeDeviceInputSystem implements IDeviceInputSystem {
    public onDeviceConnected = (deviceType: DeviceType, deviceSlot: number) => { };
    public onDeviceDisconnected = (deviceType: DeviceType, deviceSlot: number) => { };
    public onInputChanged = (deviceType: DeviceType, deviceSlot: number, eventData: IDeviceEvent) => { };

    private readonly _nativeInput: INativeInput;

    public constructor(nativeInput?: INativeInput) {
        this._nativeInput = nativeInput || this._createDummyNativeInput();

        this._nativeInput.onDeviceConnected = (deviceType, deviceSlot) => {
            this.onDeviceConnected(deviceType, deviceSlot);
        };

        this._nativeInput.onDeviceDisconnected = (deviceType, deviceSlot) => {
            this.onDeviceDisconnected(deviceType, deviceSlot);
        };

        this._nativeInput.onInputChanged = (deviceType, deviceSlot, inputIndex, previousState, currentState) => {
            const idx = (inputIndex === NativePointerInput.Horizontal || inputIndex === NativePointerInput.Vertical || inputIndex === NativePointerInput.DeltaHorizontal || inputIndex === NativePointerInput.DeltaVertical) ? PointerInput.Move : inputIndex;
            const evt = DeviceEventFactory.CreateDeviceEvent(deviceType, deviceSlot, idx, currentState, this);

            this.onInputChanged(deviceType, deviceSlot, evt);
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
    public isDeviceAvailable(deviceType: DeviceType): boolean {
        //TODO: FIx native side first
        return (deviceType === DeviceType.Mouse || deviceType === DeviceType.Touch);
    }

    /**
     * Dispose of all the observables
     */
    public dispose(): void {
        this.onDeviceConnected = () => { };
        this.onDeviceDisconnected = () => { };
        this.onInputChanged = () => { };
    }

    /**
     * For versions of BabylonNative that don't have the NativeInput plugin initialized, create a dummy version
     * @returns Object with dummy functions
     */
    private _createDummyNativeInput() {
        let nativeInput = {
            onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => { },
            onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => { },
            onInputChanged: (deviceType: DeviceType, deviceSlot: number, inputIndex: number, previousState: Nullable<number>, currentState: Nullable<number>) => { },
            pollInput: () => { return 0; },
            isDeviceAvailable: () => { return false; },
            dispose: () => { },
        };

        return nativeInput;
    }
}