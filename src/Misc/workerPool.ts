import { IDisposable } from "../scene";

interface WorkerInfo {
    worker: Worker;
    active: boolean;
}

/**
 * Helper class to push actions to a pool of workers.
 */
export class WorkerPool implements IDisposable {
    private _workerInfos: Array<WorkerInfo>;
    private _pendingActions = new Array<(worker: Worker, onComplete: () => void) => void>();

    /**
     * Constructor
     * @param workers Array of workers to use for actions
     */
    constructor(workers: Array<Worker>) {
        this._workerInfos = workers.map((worker) => ({
            worker: worker,
            active: false
        }));
    }

    /**
     * Terminates all workers and clears any pending actions.
     */
    public dispose(): void {
        for (const workerInfo of this._workerInfos) {
            workerInfo.worker.terminate();
        }

        this._workerInfos = [];
        this._pendingActions = [];
    }

    /**
     * Pushes an action to the worker pool. If all the workers are active, the action will be
     * pended until a worker has completed its action.
     * @param action The action to perform. Call onComplete when the action is complete.
     */
    public push(action: (worker: Worker, onComplete: () => void) => void): void {
        for (const workerInfo of this._workerInfos) {
            if (!workerInfo.active) {
                this._execute(workerInfo, action);
                return;
            }
        }

        this._pendingActions.push(action);
    }

    private _execute(workerInfo: WorkerInfo, action: (worker: Worker, onComplete: () => void) => void): void {
        workerInfo.active = true;
        action(workerInfo.worker, () => {
            workerInfo.active = false;
            const nextAction = this._pendingActions.shift();
            if (nextAction) {
                this._execute(workerInfo, nextAction);
            }
        });
    }
}
