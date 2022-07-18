import { Tools } from "../../../Misc/tools";
import type { IActionOptions } from "./BaseAction";
import { BaseAction } from "./BaseAction";

export interface IRaiseEventAction extends IActionOptions {
    eventName: string;
}

export class RaiseEventAction extends BaseAction<IRaiseEventAction> {
    protected async _execute(): Promise<void> {
        if (!this._customEventManager) {
            return Tools.Warn("No custom event manager available for RaiseEventAction");
        }
        this._customEventManager.raiseEvent({
            name: this._options.eventName,
        });
    }

    protected _stop(): void {
        // no-op
    }
}
