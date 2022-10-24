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

    get trigger() {
        return this._trigger;
    }

    get action() {
        return this._action;
    }

    public build() {
        const obs = this._trigger.onTriggeredObservable.add(() => this._action.execute());
        if (obs) {
            this._action.addObserver(obs);
        }
    }
}
