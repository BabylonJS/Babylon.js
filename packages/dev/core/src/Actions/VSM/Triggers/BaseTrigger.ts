import { Nullable } from "../../../types";
import { Observable } from "../../../Misc/observable";
import { IDisposable, Scene } from "../../../scene";
import { CustomEventManager, ICustomEvent } from "../customEventManager";

export abstract class BaseTrigger<O = void, T = any> implements IDisposable {
    private _payload: T;
    private _duration: number = 0;
    protected _triggered: boolean = false;
    protected _eventsListened: string[] = [];
    public onTriggeredObservable: Observable<T> = new Observable();
    public triggerAfterDuration: number = 0;
    public reversed: boolean = false;
    public removeAfterTrigger: boolean = false;

    protected _customEventManager: Nullable<CustomEventManager> = null;
    public set customEventManager(customEventManager: Nullable<CustomEventManager>) {
        if (customEventManager) {
            if(this._customEventManager && this._customEventManager !== customEventManager) {
                // remove event listeners from old event listener
            }
            this._customEventManager = customEventManager;
            this._registerEvents();
        } else {
            if(this._customEventManager) {
                // remove event listeners
            }
            this._customEventManager = customEventManager;
        }
    }

    constructor(protected _options: O) {}

    public update(scene: Scene): void {
        const condition = this._checkConditions(scene);
        this._checkTriggeredState(condition, scene.getEngine().getDeltaTime());
    }

    public eventRaised(_event: ICustomEvent<any>): void {}

    public isEventListened(event: string): boolean {
        return this._eventsListened.indexOf(event) !== -1;
    }

    public dispose(): void {
        this.onTriggeredObservable.clear();
    }

    protected _checkConditions(_scene: Scene): boolean {
        return false;
    }

    protected _registerEvents(): void {
        // no-op, override if you need to register events
    }

    protected _unregisteredEvents(): void {

    }

    private _trigger(): void {
        this._triggered = true;
        this.onTriggeredObservable.notifyObservers(this._payload);
    }

    protected _checkTriggeredState(value: boolean, deltaTime: number = 0): void {
        const correctValue = this.reversed ? !value : value;
        if (this._triggered !== correctValue) {
            if (correctValue) {
                // should be triggered, check duration definition
                if (!this.triggerAfterDuration || this._duration >= this.triggerAfterDuration) {
                    this._trigger();
                } else {
                    this._duration += deltaTime;
                }
            } else {
                // false, reset state
                this._duration = 0;
                this._triggered = false;
            }
        }
    }
}
