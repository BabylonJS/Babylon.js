import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";

/**
 * This class represents a condition that will trigger an action when it is true
 */
export class BaseTrigger {
    private _triggered = false;
    private _onTriggeredObservable: Observable<void>;

    public constructor() {
        this._onTriggeredObservable = new Observable();
    }

    public condition(scene: Scene) {
        /** Overriden in child classes */
        return false;
    }

    public _check(scene: Scene) {
        if (!this._triggered && this.condition(scene)) {
            this._triggered = true;
            this._onTriggeredObservable.notifyObservers();
        } else if (this._triggered && !this.condition(scene)) {
            this._triggered = false;
        }
    }

    get onTriggeredObservable() {
        return this._onTriggeredObservable;
    }
}
