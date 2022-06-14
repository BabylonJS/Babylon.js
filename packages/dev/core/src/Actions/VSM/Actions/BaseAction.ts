import { IDisposable } from "../../../scene";
import { Observable } from "../../../Misc/observable";
import { Nullable } from "../../../types";
import { CustomEventManager } from "../customEventManager";
import { Tools } from "../../../Misc/tools";

export abstract class BaseAction<T = any> implements IDisposable {
    protected _isRunning: boolean = false;
    // TODO - run parallel and next actions
    // glEF sees that as a single action
    public parallelActions: BaseAction[] = [];
    // Actions in this array will run IN PARALLEL after this action is done
    public nextActions: BaseAction[] = [];

    protected _runAgainTimes: number = 0;

    public onActionExecutionStartedObservable = new Observable<BaseAction>();
    public onActionDoneObservable = new Observable<BaseAction>();

    protected _customEventManager: Nullable<CustomEventManager> = null;
    public set customEventManager(customEventManager: Nullable<CustomEventManager>) {
        this._customEventManager = customEventManager;
    }

    constructor(protected _options: T) {
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
        if (this._isRunning) {
            Tools.Warn("Action is already running");
            return;
        }
        this._isRunning = true;
        this.onActionExecutionStartedObservable.notifyObservers(this);
        this._execute().then(() => {
            this._isRunning = false;
            this.onActionDoneObservable.notifyObservers(this);
        });
    }
    // Not sure this is the right architecture. This expects execute to resolve when the action is done.
    protected abstract _execute(): Promise<void>;
    public stop(): void {
        if (!this._isRunning) {
            return;
        }
        this._stop();
        this._isRunning = false;
    }
    protected abstract _stop(): void;

    dispose(): void {
        this.onActionExecutionStartedObservable.clear();
        this.onActionDoneObservable.clear();
    }
}
