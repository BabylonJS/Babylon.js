import { Observable } from "./observable";
import type { AsyncCoroutine, CoroutineStep, CoroutineScheduler } from "./coroutine";
import { runCoroutineAsync, inlineScheduler } from "./coroutine";

function CreateObservableScheduler<T>(observable: Observable<any>): { scheduler: CoroutineScheduler<T>; dispose: () => void } {
    const coroutines = new Array<AsyncCoroutine<T>>();
    const onSteps = new Array<(stepResult: CoroutineStep<T>) => void>();
    const onErrors = new Array<(stepError: any) => void>();

    const observer = observable.add(() => {
        const count = coroutines.length;
        for (let i = 0; i < count; i++) {
            inlineScheduler(coroutines.shift()!, onSteps.shift()!, onErrors.shift()!);
        }
    });

    const scheduler = (coroutine: AsyncCoroutine<T>, onStep: (stepResult: CoroutineStep<T>) => void, onError: (stepError: any) => void) => {
        coroutines.push(coroutine);
        onSteps.push(onStep);
        onErrors.push(onError);
    };

    return {
        scheduler: scheduler,
        dispose: () => {
            observable.remove(observer);
        },
    };
}

declare module "./observable" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export interface Observable<T> {
        /**
         * Internal observable-based coroutine scheduler instance.
         */
        _coroutineScheduler?: CoroutineScheduler<void>;

        /**
         * Internal disposal method for observable-based coroutine scheduler instance.
         */
        _coroutineSchedulerDispose?: () => void;

        /**
         * Runs a coroutine asynchronously on this observable
         * @param coroutine the iterator resulting from having started the coroutine
         * @returns a promise which will be resolved when the coroutine finishes or rejected if the coroutine is cancelled
         */
        runCoroutineAsync(coroutine: AsyncCoroutine<void>): Promise<void>;

        /**
         * Cancels all coroutines currently running on this observable
         */
        cancelAllCoroutines(): void;
    }
}

Observable.prototype.runCoroutineAsync = function (coroutine: AsyncCoroutine<void>) {
    if (!this._coroutineScheduler) {
        const schedulerAndDispose = CreateObservableScheduler<void>(this);
        this._coroutineScheduler = schedulerAndDispose.scheduler;
        this._coroutineSchedulerDispose = schedulerAndDispose.dispose;
    }

    return runCoroutineAsync(coroutine, this._coroutineScheduler);
};

Observable.prototype.cancelAllCoroutines = function () {
    if (this._coroutineSchedulerDispose) {
        this._coroutineSchedulerDispose();
    }
    this._coroutineScheduler = undefined;
    this._coroutineSchedulerDispose = undefined;
};
