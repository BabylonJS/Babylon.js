import { Tools } from "../../../Misc/tools";
import { BaseAction } from "./BaseAction";

export interface IRaiseEventAction {
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
