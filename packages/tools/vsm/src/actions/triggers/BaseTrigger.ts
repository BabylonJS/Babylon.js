import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";

/**
 * This class represents a trigger that can turn on one of two ways: either by having a
 * condition defined in `condition` flip from true to false, or by manually triggering
 * with `triggerOn` function
 */
export class BaseTrigger {
    private _lastCondition = false;
    private _onTriggeredObservable: Observable<void>;

    public constructor() {
        this._onTriggeredObservable = new Observable();
    }

    public condition(scene: Scene) {
        /** Overriden in child classes */
        return false;
    }

    protected _triggerOn() {
        this._lastCondition = true;
        this._onTriggeredObservable.notifyObservers();
    }

    protected _triggerOff() {
        this._lastCondition = false;
    }

    public _check(scene: Scene) {
        if (!this._lastCondition && this.condition(scene)) {
            this._triggerOn();
        } else if (this._lastCondition && !this.condition(scene)) {
            this._triggerOff();
        }
    }

    get onTriggeredObservable() {
        return this._onTriggeredObservable;
    }
}
