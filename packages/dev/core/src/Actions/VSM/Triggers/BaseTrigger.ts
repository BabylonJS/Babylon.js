import { Observable } from "../../../Misc/observable";
import { IDisposable, Scene } from "../../../scene";
import { ICustomEvent } from "../customEventManager";

export abstract class BaseTrigger<T = void> implements IDisposable {
    private _payload: T;
    private _duration: number = 0;
    protected _triggered: boolean = false;
    protected _eventsListened: string[] = [];
    public onTriggeredObservable: Observable<T> = new Observable();
    public triggerAfterDuration: number = 0;
    public reversed: boolean = false;
    public removeAfterTrigger: boolean = false;

    constructor() {}

    public update(scene: Scene): void {
        const condition = this._checkConditions(scene);
        this._checkTriggeredState(condition, scene.getEngine().getDeltaTime());
    }

    public eventRaised(_event: ICustomEvent<undefined>): void {}

    public isEventListened(event: string): boolean {
        return this._eventsListened.indexOf(event) !== -1;
    }

    public dispose(): void {
        this.onTriggeredObservable.clear();
    }

    protected abstract _checkConditions(scene: Scene): boolean;

    protected _trigger(): void {
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
