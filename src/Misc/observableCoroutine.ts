import { Nullable } from "../types";
import { Observable } from "./observable";

declare module "./observable" {
    export interface Observable<T> {
        /**
         * Internal list of iterators and promise resolvers associated with coroutines.
         */
        coroutineIterators: Nullable<Array<{ iterator: Iterator<void, void, void>, resolver: () => void, rejecter: () => void }>>;

        /**
         * Runs a coroutine asynchronously on this observable
         * @param coroutineIterator the iterator resulting from having started the coroutine
         * @returns a promise which will be resolved when the coroutine finishes or rejected if the coroutine is cancelled
         */
        runCoroutineAsync(coroutineIterator: Iterator<void, void, void>): Promise<void>;

        /**
         * Cancels all coroutines currently running on this observable
         */
        cancelAllCoroutines(): void;
    }
}

Observable.prototype.runCoroutineAsync = function (coroutineIterator: Iterator<void, void, void>): Promise<void> {
    if (!this.coroutineIterators) {
        this.coroutineIterators = [];

        this.add(() => {
            for (let idx = this.coroutineIterators!.length - 1; idx >= 0; --idx) {
                if (this.coroutineIterators![idx].iterator.next().done) {
                    this.coroutineIterators![idx].resolver();
                    this.coroutineIterators!.splice(idx, 1);
                }
            }
        });
    }

    return new Promise((resolver, rejecter) => {
        this.coroutineIterators?.push({
            iterator: coroutineIterator,
            resolver: resolver,
            rejecter: rejecter
        });
    });
};

Observable.prototype.cancelAllCoroutines = function (): void {
    this.coroutineIterators!.forEach((coroutine) => {
        coroutine.rejecter();
    });
    this.coroutineIterators = [];
};
