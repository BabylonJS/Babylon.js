import type { IDisposable, Scene } from "../../../scene";
import { Observable } from "../../../Misc/observable";
import type { Nullable } from "../../../types";
import type { CustomEventManager } from "../customEventManager";
import { Tools } from "../../../Misc/tools";
import { setAndStartTimer } from "../../../Misc/timer";

export interface IActionOptions {
    delay?: number; // in ms
    playCount?: number;
    repeatUntilStopped?: boolean;
    parallelActions?: BaseAction<IActionOptions>[];
    /**
     * If set to true the action will be considered done after it is done with its own action, not waiting for the parallel actions to be done.
     */
    separateParallelExecution?: boolean;
    nextActions?: BaseAction<IActionOptions>[];
    customEventManager?: CustomEventManager;
}

let idCounter = 0;

export abstract class BaseAction<T extends IActionOptions> implements IDisposable {
    protected _isRunning: boolean = false;
    protected _uniqueId: number = idCounter++;
    // isRunning can be true while this is true!
    protected _isPaused: boolean = false;
    // glEF sees that as a single action
    public parallelActions: BaseAction<IActionOptions>[] = [];
    // Actions in this array will run IN PARALLEL after this action is done
    public nextActions: BaseAction<IActionOptions>[] = [];

    public onActionExecutionStartedObservable = new Observable<BaseAction<IActionOptions>>();
    public onActionDoneObservable = new Observable<BaseAction<IActionOptions>>();
    public waitForDoneAsync: Promise<void>;

    protected _customEventManager: Nullable<CustomEventManager>;
    public set customEventManager(customEventManager: Nullable<CustomEventManager>) {
        this._customEventManager = customEventManager;
    }

    constructor(protected _options: T, protected _scene?: Nullable<Scene>) {
        this._options = this._options || ({} as T);

        if (this._options.parallelActions) {
            this.parallelActions.push(...this._options.parallelActions);
        }
        if (this._options.nextActions) {
            this.nextActions.push(...this._options.nextActions);
        }
        this._customEventManager = this._options.customEventManager ?? null;
        this.onActionExecutionStartedObservable.add(() => {
            this._options.playCount && this._options.playCount--;
            this.parallelActions.forEach((action) => {
                action.execute();
            });
            // only run parallel once!
            this.parallelActions.length = 0;
        });
        this.waitForDoneAsync = new Promise((resolve) => {
            this.onActionDoneObservable.add(() => {
                if (this._options.playCount || this._options.repeatUntilStopped) {
                    this.execute();
                } else {
                    resolve();
                    this.nextActions.forEach((action) => {
                        action.execute();
                    });
                }
            });
        });
    }

    public set separateParallelExecution(value: boolean) {
        this._options.separateParallelExecution = value;
    }

    public get isRunning(): boolean {
        return this._isRunning;
    }

    // TODO - is this a useful helper function?
    // public runAfterCompletion(): void {
    //     if (!this._isRunning) {
    //         this.execute();
    //     } else {
    //         this._runAgainTimes++;
    //     }
    // }

    public execute(): void {
        if (this._isRunning) {
            Tools.Warn("Action is already running");
            return;
        }
        // console.log("Action started", this);
        this._isRunning = true;
        this.onActionExecutionStartedObservable.notifyObservers(this);
        const executeFunction = async () => {
            await this._execute();
            if (!this._options.separateParallelExecution && this.parallelActions.length) {
                // need to wait for all parallel actions to be done
                await Promise.all(this.parallelActions.map((action) => action.waitForDoneAsync));
            }
            this._isRunning = false;
            this.onActionDoneObservable.notifyObservers(this);
        };
        // check for delay!
        if (this._options.delay) {
            // if a scene was provided use its before-render context for the timer
            if (this._scene) {
                setAndStartTimer({
                    contextObservable: this._scene.onBeforeRenderObservable,
                    timeout: this._options.delay,
                    onEnded: executeFunction,
                    breakCondition: () => {
                        return !this._isRunning;
                    },
                });
            } else {
                // otherwise use setTimeout
                setTimeout(() => {
                    if (this._isRunning) {
                        executeFunction();
                    }
                }, this._options.delay);
            }
        } else {
            executeFunction();
        }
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

    public pause(): void {
        if (!this._isRunning || this._isPaused) {
            return;
        }
        this._pause();
        this._isPaused = true;
    }
    protected _pause(): void {
        // no-op - override when needed.
        // TODO - should this be abstract as well?
    }

    public resume(): void {
        if (!this._isRunning || !this._isPaused) {
            return;
        }
        this._resume();
        this._isPaused = false;
    }
    protected _resume(): void {
        // no-op - override when needed.
        // TODO - should this be abstract as well?
    }

    dispose(): void {
        this.onActionExecutionStartedObservable.clear();
        this.onActionDoneObservable.clear();
    }
}
