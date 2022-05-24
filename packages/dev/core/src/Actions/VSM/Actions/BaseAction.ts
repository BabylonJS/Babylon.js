import { IDisposable } from "../../../scene";
import { Observable } from "../../../Misc/observable";
import { ICustomEvent } from "../customEventManager";

export abstract class BaseAction implements IDisposable {
    protected _isRunning: boolean = false;
    // glEF sees that as a single action
    public parallelActions: BaseAction[] = [];
    // Actions in this array will run IN PARALLEL after this action is done
    public nextActions: BaseAction[] = [];

    private _runAgainTimes: number = 0;

    public onActionExecutedObservable = new Observable<BaseAction>();
    public onActionDoneObservable = new Observable<BaseAction>();
    public onEventRaisedObservable = new Observable<ICustomEvent<any>>();

    constructor() {
        this.onActionDoneObservable.add(() => {
            if (this._runAgainTimes) {
                this._runAgainTimes--;
                this.execute();
            }
        });
    }

    public get isRunning(): boolean {
        return this._isRunning;
    }

    public runAfterCompletion(): void {
        if (!this._isRunning) {
            this.execute();
        } else {
            this._runAgainTimes++;
        }
    }

    public execute(): void {
        this._isRunning = true;
        this._execute();
    }
    protected abstract _execute(): void;
    public stop(): void {
        this._stop();
        this._isRunning = false;
    }
    protected abstract _stop(): void;

    dispose(): void {
        this.onActionExecutedObservable.clear();
        this.onActionDoneObservable.clear();
        this.onEventRaisedObservable.clear();
    }
}
