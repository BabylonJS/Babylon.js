import { Observable } from "./observable";
import { AsyncCoroutine, CoroutineStep, CoroutineScheduler, runCoroutineAsync, inlineScheduler } from "./coroutine";

function createObservableScheduler<T>(observable: Observable<any>) {
    const coroutines = new Array<AsyncCoroutine<T>>();
    const onSuccesses = new Array<(stepResult: CoroutineStep<T>) => void>();
    const onErrors = new Array<(stepError: any) => void>();

    const observer = observable.add(() => {
        const count = coroutines.length;
        for (let i = 0; i < count; i++) {
            inlineScheduler(coroutines.pop()!, onSuccesses.pop()!, onErrors.pop()!);
        }
    });

    const scheduler = (coroutine: AsyncCoroutine<T>, onSuccess: (stepResult: CoroutineStep<T>) => void, onError: (stepError: any) => void) => {
        coroutines.push(coroutine);
        onSuccesses.push(onSuccess);
        onErrors.push(onError);
    };

    scheduler.dispose = () => {
        observable.remove(observer);
    };

    return scheduler;
}

declare module "./observable" {
    export interface Observable<T> {
        /**
         * Internal observable based coroutine scheduler instance.
         */
        coroutineScheduler: CoroutineScheduler<void> | undefined;

        /**
         * Internal AbortController for in flight coroutines.
         */
        coroutineAbortController: AbortController | undefined;

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

Observable.prototype.runCoroutineAsync = function(coroutine: AsyncCoroutine<void>) {
    if (!this.coroutineScheduler) {
        this.coroutineScheduler = createObservableScheduler(this);
    }

    if (!this.coroutineAbortController) {
        this.coroutineAbortController = new AbortController();
    }

    return runCoroutineAsync(coroutine, this.coroutineScheduler, this.coroutineAbortController.signal);
};

Observable.prototype.cancelAllCoroutines = function() {
    this.coroutineAbortController?.abort();
    this.coroutineAbortController = undefined;
};
