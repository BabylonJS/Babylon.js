import { Constants } from "../../Engines/constants";
import { EventConstants, IEvent } from "../../Events/deviceInputEvents";
import { Nullable } from "../../types";
import { DeviceType, PointerInput } from "../InputDevices/deviceEnums";
import { IDeviceInputSystem } from "../Interfaces/inputInterfaces";

/**
 * Class to wrap DeviceInputSystem data into an event object
 */
export class DeviceEventFactory {
    /**
     * Create device input events based on provided type and slot
     *
     * @param deviceType Type of device
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     * @param currentState Current value for given input
     * @param deviceInputSystem Reference to DeviceInputSystem
     * @param elementToAttachTo HTMLElement to reference as target for inputs
     * @returns IEvent object
     */
    public static CreateDeviceEvent(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: Nullable<number>, deviceInputSystem: IDeviceInputSystem, elementToAttachTo?: any): IEvent {
        switch (deviceType) {
            case DeviceType.Keyboard:
                return this._createKeyboardEvent(inputIndex, currentState, deviceInputSystem, elementToAttachTo);
            case DeviceType.Mouse:
                if (inputIndex === PointerInput.MouseWheelX || inputIndex === PointerInput.MouseWheelY || inputIndex === PointerInput.MouseWheelZ) {
                    return this._createWheelEvent(deviceType, deviceSlot, inputIndex, currentState, deviceInputSystem, elementToAttachTo);
                }
            case DeviceType.Touch:
                return this._createPointerEvent(deviceType, deviceSlot, inputIndex, currentState, deviceInputSystem, elementToAttachTo);
            default:
                throw `Unable to generate event for device ${DeviceType[deviceType]}`;
        }
    }

    /**
     * Creates pointer event
     *
     * @param deviceType Type of device
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     * @param currentState Current value for given input
     * @param deviceInputSystem Reference to DeviceInputSystem
     * @param elementToAttachTo HTMLElement to reference as target for inputs
     * @returns IEvent object (Pointer)
     */
    private static _createPointerEvent(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: Nullable<number>, deviceInputSystem: IDeviceInputSystem, elementToAttachTo?: any): any {
        const evt = this._createMouseEvent(deviceType, deviceSlot, inputIndex, currentState, deviceInputSystem, elementToAttachTo);

        evt.pointerId = deviceType === DeviceType.Mouse ? 1 : deviceSlot;

        if (
            inputIndex === PointerInput.Horizontal ||
            inputIndex === PointerInput.Vertical ||
            inputIndex === PointerInput.DeltaHorizontal ||
            inputIndex === PointerInput.DeltaVertical ||
            inputIndex === PointerInput.FakeMove
        ) {
            evt.type = "pointermove";
        }
        else if (inputIndex >= PointerInput.LeftClick && inputIndex <= PointerInput.RightClick) {
            evt.type = (currentState === 1) ? "pointerdown" : "pointerup";
            evt.button = inputIndex - 2;
        }

        return evt;
    }

    /**
     * Create Mouse Wheel Event
     * @param deviceType Type of device
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     * @param currentState Current value for given input
     * @param deviceInputSystem Reference to DeviceInputSystem
     * @param elementToAttachTo HTMLElement to reference as target for inputs
     * @returns IEvent object (Wheel)
     */
    private static _createWheelEvent(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: Nullable<number>, deviceInputSystem: IDeviceInputSystem, elementToAttachTo: any): any {
        const evt = this._createMouseEvent(deviceType, deviceSlot, inputIndex, currentState, deviceInputSystem, elementToAttachTo);

        evt.type = "wheel";
        evt.deltaMode = EventConstants.DOM_DELTA_PIXEL;
        evt.deltaX = (inputIndex === PointerInput.MouseWheelX) ? currentState : deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.MouseWheelX);
        evt.deltaY = (inputIndex === PointerInput.MouseWheelY) ? currentState : deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.MouseWheelY);
        evt.deltaZ = (inputIndex === PointerInput.MouseWheelZ) ? currentState : deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.MouseWheelZ);

        return evt;
    }

    /**
     * Create Mouse Event
     * @param deviceType Type of device
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     * @param currentState Current value for given input
     * @param deviceInputSystem Reference to DeviceInputSystem
     * @param elementToAttachTo HTMLElement to reference as target for inputs
     * @returns IEvent object (Mouse)
     */
    private static _createMouseEvent(deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: Nullable<number>, deviceInputSystem: IDeviceInputSystem, elementToAttachTo?: any): any {
        const evt = this._createEvent(elementToAttachTo);
        const pointerX = deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.Horizontal);
        const pointerY = deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.Vertical);
        // If dealing with a change to the delta, grab values for event init
        const movementX = inputIndex === PointerInput.DeltaHorizontal ? currentState : 0;
        const movementY = inputIndex === PointerInput.DeltaVertical ? currentState : 0;
        // Get offsets from container
        const offsetX = inputIndex === PointerInput.DeltaHorizontal && elementToAttachTo ? movementX! - elementToAttachTo.getBoundingClientRect().x : 0;
        const offsetY = inputIndex === PointerInput.DeltaVertical && elementToAttachTo ? movementY! - elementToAttachTo.getBoundingClientRect().y : 0;
        this._checkNonCharacterKeys(evt, deviceInputSystem);

        evt.clientX = pointerX;
        evt.clientY = pointerY;
        evt.movementX = movementX;
        evt.movementY = movementY;
        evt.offsetX = offsetX;
        evt.offsetY = offsetY;
        evt.x = pointerX;
        evt.y = pointerY;

        return evt;
    }

    /**
     * Create Keyboard Event
     * @param inputIndex Id of input to be checked
     * @param currentState Current value for given input
     * @param deviceInputSystem Reference to DeviceInputSystem
     * @param elementToAttachTo HTMLElement to reference as target for inputs
     * @returns IEvent object (Keyboard)
     */
    private static _createKeyboardEvent(inputIndex: number, currentState: Nullable<number>, deviceInputSystem: IDeviceInputSystem, elementToAttachTo?: any): any {
        const evt = this._createEvent(elementToAttachTo);
        this._checkNonCharacterKeys(evt, deviceInputSystem);

        evt.type = currentState === 1 ? "keydown" : "keyup";
        evt.key = String.fromCharCode(inputIndex);
        evt.keyCode = inputIndex;

        return evt;
    }

    /**
     * Add parameters for non-character keys (Ctrl, Alt, Meta, Shift)
     * @param evt Event object to add parameters to
     * @param deviceInputSystem DeviceInputSystem to pull values from
     */
    private static _checkNonCharacterKeys(evt: any, deviceInputSystem: IDeviceInputSystem): void {
        const isKeyboardActive = deviceInputSystem.isDeviceAvailable(DeviceType.Keyboard);
        const altKey = isKeyboardActive && deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_ALT_KEY) === 1;
        const ctrlKey = isKeyboardActive && deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_CTRL_KEY) === 1;
        const metaKey =
            isKeyboardActive &&
            (deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_META_KEY1) === 1 ||
                deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_META_KEY2) === 1 ||
                deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_META_KEY3) === 1);
        const shiftKey = isKeyboardActive && deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_SHIFT_KEY) === 1;

        evt.altKey = altKey;
        evt.ctrlKey = ctrlKey;
        evt.metaKey = metaKey;
        evt.shiftKey = shiftKey;
    }

    /**
     * Create base event object
     * @param elementToAttachTo Value to use as event target
     * @returns
     */
    private static _createEvent(elementToAttachTo: any): any {
        const evt: { [k: string]: any } = {};
        evt.preventDefault = () => { };
        evt.target = elementToAttachTo;

        return evt;
    }
}