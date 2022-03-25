import type { IDisposable } from "../scene";

/** @ignore */
interface WorkerInfo {
    workerPromise: Promise<Worker>;
    idle: boolean;
    timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * Helper class to push actions to a pool of workers.
 */
export class WorkerPool implements IDisposable {
    protected _workerInfos: Array<WorkerInfo>;
    protected _pendingActions = new Array<(worker: Worker, onComplete: () => void) => void>();

    /**
     * Constructor
     * @param workers Array of workers to use for actions
     */
    constructor(workers: Array<Worker>) {
        this._workerInfos = workers.map((worker) => ({
            workerPromise: Promise.resolve(worker),
            idle: true,
        }));
    }

    /**
     * Terminates all workers and clears any pending actions.
     */
    public dispose(): void {
        for (const workerInfo of this._workerInfos) {
            workerInfo.workerPromise.then((worker) => {
                worker.terminate();
            });
        }

        this._workerInfos.length = 0;
        this._pendingActions.length = 0;
    }

    /**
     * Pushes an action to the worker pool. If all the workers are active, the action will be
     * pended until a worker has completed its action.
     * @param action The action to perform. Call onComplete when the action is complete.
     */
    public push(action: (worker: Worker, onComplete: () => void) => void): void {
        if (!this._executeOnIdleWorker(action)) {
            this._pendingActions.push(action);
        }
    }

    protected _executeOnIdleWorker(action: (worker: Worker, onComplete: () => void) => void): boolean {
        for (const workerInfo of this._workerInfos) {
            if (workerInfo.idle) {
                this._execute(workerInfo, action);
                return true;
            }
        }

        return false;
    }

    protected _execute(workerInfo: WorkerInfo, action: (worker: Worker, onComplete: () => void) => void): void {
        workerInfo.idle = false;
        workerInfo.workerPromise.then((worker) => {
            action(worker, () => {
                const nextAction = this._pendingActions.shift();
                if (nextAction) {
                    this._execute(workerInfo, nextAction);
                } else {
                    workerInfo.idle = true;
                }
            });
        });
    }
}

/**
 * Options for AutoReleaseWorkerPool
 */
export interface AutoReleaseWorkerPoolOptions {
    /**
     * Idle time elapsed before workers are terminated.
     */
    idleTimeElapsedBeforeRelease: number;
}

/**
 * Similar to the WorkerPool class except it creates and destroys workers automatically with a maximum of `maxWorkers` workers.
 * Workers are terminated when it is idle for at least `idleTimeElapsedBeforeRelease` milliseconds.
 */
export class AutoReleaseWorkerPool extends WorkerPool {
    /**
     * Default options for the constructor.
     * Override to change the defaults.
     */
    public static DefaultOptions: AutoReleaseWorkerPoolOptions = {
        idleTimeElapsedBeforeRelease: 1000,
    };

    private readonly _maxWorkers: number;
    private readonly _createWorkerAsync: () => Promise<Worker>;
    private readonly _options: AutoReleaseWorkerPoolOptions;

    constructor(maxWorkers: number, createWorkerAsync: () => Promise<Worker>, options = AutoReleaseWorkerPool.DefaultOptions) {
        super([]);

        this._maxWorkers = maxWorkers;
        this._createWorkerAsync = createWorkerAsync;
        this._options = options;
    }

    public push(action: (worker: Worker, onComplete: () => void) => void): void {
        if (!this._executeOnIdleWorker(action)) {
            if (this._workerInfos.length < this._maxWorkers) {
                const workerInfo: WorkerInfo = {
                    workerPromise: this._createWorkerAsync(),
                    idle: false,
                };
                this._workerInfos.push(workerInfo);
                this._execute(workerInfo, action);
            } else {
                this._pendingActions.push(action);
            }
        }
    }

    protected _execute(workerInfo: WorkerInfo, action: (worker: Worker, onComplete: () => void) => void): void {
        // Reset the idle timeout.
        if (workerInfo.timeoutId) {
            clearTimeout(workerInfo.timeoutId);
            delete workerInfo.timeoutId;
        }

        super._execute(workerInfo, (worker, onComplete) => {
            action(worker, () => {
                onComplete();

                if (workerInfo.idle) {
                    // Schedule the worker to be terminated after the elapsed time.
                    workerInfo.timeoutId = setTimeout(() => {
                        workerInfo.workerPromise.then((worker) => {
                            worker.terminate();
                        });

                        const indexOf = this._workerInfos.indexOf(workerInfo);
                        if (indexOf !== -1) {
                            this._workerInfos.splice(indexOf, 1);
                        }
                    }, this._options.idleTimeElapsedBeforeRelease);
                }
            });
        });
    }
}
