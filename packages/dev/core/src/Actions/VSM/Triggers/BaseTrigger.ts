import { Observable } from "../../../Misc/observable";
import { IDisposable } from "../../../scene";

export abstract class BaseTrigger<T = void> implements IDisposable {
    private _payload: T;
    public onTriggeredObservable: Observable<T> = new Observable();

    constructor() {}

    abstract dispose(): void;

    public attachToAction(action: Action): void {
    };

    public abstract _checkConditions();

    protected _trigger(): void {
        this.onTriggeredObservable.notifyObservers(this._payload);
    }
}
