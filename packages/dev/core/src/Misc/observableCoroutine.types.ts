import { type AsyncCoroutine, type CoroutineScheduler } from "./coroutine";
/** This file must only contain pure code and pure imports */

declare module "./observable.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
