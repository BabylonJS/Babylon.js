import { PointerEventTypes } from "../Events/pointerEvents";
import type { IPointerEvent, IWheelEvent } from "../Events/deviceInputEvents";
import type { DeviceType } from "./InputDevices/deviceEnums";
import { PointerInput } from "./InputDevices/deviceEnums";
import type { DeviceSource } from "./InputDevices/deviceSource";
import { Scene } from "../scene";

/** @internal */
export class GestureRecognizer {
    private static _PREVIOUS_POINTER_TIME: number = 0;
    private static _DOUBLE_CLICK_OCCURED: boolean = false;

    /** @internal */
    public static DeterminePointerEventType(deviceSource: DeviceSource<DeviceType.Mouse | DeviceType.Touch>, eventData: IPointerEvent | IWheelEvent) {
        const doubleClickDelay = Scene.DoubleClickDelay;
        const wheelEventData = eventData as IWheelEvent;
        const pointerEventData = eventData as IPointerEvent;
        let type = 0;

        if (wheelEventData.deltaMode !== undefined) {
            type = PointerEventTypes.POINTERWHEEL;
        } else if (pointerEventData.inputIndex === PointerInput.Move) {
            type = PointerEventTypes.POINTERMOVE;
        } else if (deviceSource.getInput(pointerEventData.inputIndex) === 1) {
            type = PointerEventTypes.POINTERDOWN;
        } else {
            type = PointerEventTypes.POINTERUP;

            if (Date.now() - this._PREVIOUS_POINTER_TIME < doubleClickDelay && !this._DOUBLE_CLICK_OCCURED && type === PointerEventTypes.POINTERUP) {
                this._DOUBLE_CLICK_OCCURED = true;
                console.log("Double click occured");
                type += PointerEventTypes.POINTERDOUBLETAP;
            } else {
                this._DOUBLE_CLICK_OCCURED = false;
                console.log("Single click occured");
                type += PointerEventTypes.POINTERTAP;
            }
        }

        if ((type & PointerEventTypes.POINTERUP) !== 0 || (type & PointerEventTypes.POINTERDOUBLETAP) !== 0) {
            this._PREVIOUS_POINTER_TIME = Date.now();
        }

        return type;
    }
}
