import type { BaseAction } from "./actions/BaseAction";
import type { BaseTrigger } from "./triggers/BaseTrigger";

/**
 * A Behavior connects a trigger and an action. It waits for the trigger to be
 * activated and executes the corresponding action when this happens.
 */
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
        this._trigger.onTriggeredObservable.add(() => this._action.execute());
    }
}
