/**
 * Behavior represents a connection between a trigger and an action
 */

import type { BaseAction } from "./actions/BaseAction";
import type { BaseTrigger } from "./triggers/BaseTrigger";

export class BaseBehavior {
    private _trigger: BaseTrigger;
    private _action: BaseAction;

    constructor(trigger: BaseTrigger, action: BaseAction) {
        this._trigger = trigger;
        this._action = action;
    }

    public build() {
        const obs = this._trigger.onTriggeredObservable.add(() => this._action.execute());
        if (obs) {
            this._action.addObserver(obs);
        }
    }
}
