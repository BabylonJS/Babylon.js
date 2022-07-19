import type { Nullable } from "../../../types";
import type { ICustomEvent } from "../customEventManager";
import { BaseTrigger } from "./BaseTrigger";

// Hover trigger is basically OnPointerOver trigger (and OnPointerOut trigger)

export interface IEventTriggerOptions {
    eventName: string;
}

export class EventTrigger<T = undefined> extends BaseTrigger<IEventTriggerOptions> {
    private _callback: Nullable<(event: ICustomEvent<T>) => void>;
    protected _registerEvents(): void {
        if (!this._customEventManager) {
            // throw? log?
            return;
        }
        this._callback = (_event: ICustomEvent<T>) => {
            this._checkTriggeredState(true);
        };
        this._customEventManager.addEventListener(this._options.eventName, this._callback);
    }

    protected _unregisteredEvents(): void {
        if (!this._customEventManager || !this._callback) {
            // throw? log?
            return;
        }
        this._customEventManager.removeEventListener(this._options.eventName, this._callback);
        this._callback = null;
    }
}
