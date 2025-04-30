import { Deferred } from "./deferred";

/**
 * Provides a simple way of creating the rough equivalent of an async critical section.
 *
 * @example
 * ```typescript
 * const myLock = new AsyncLock();
 *
 * private async MyFuncAsync(): Promise<void> {
 *   await myLock.lockAsync(async () => {
 *     await operation1Async();
 *     await operation2Async();
 *   });
 * }
 * ```
 */
export class AsyncLock {
    private _currentOperation: Promise<void> = Promise.resolve();

    /**
     * Executes the provided function when the lock is acquired (e.g. when the previous operation finishes).
     * @param func The function to execute.
     * @param signal An optional signal that can be used to abort the operation.
     * @returns A promise that resolves when the func finishes executing.
     */
    public lockAsync<T>(func: () => T | Promise<T>, signal?: AbortSignal): Promise<T> {
        signal?.throwIfAborted();

        const wrappedFunc = signal
            ? () => {
                  signal.throwIfAborted();
                  return func();
              }
            : func;

        const newOperation = this._currentOperation.then(wrappedFunc);
        // NOTE: It would be simpler to just hold a Promise<unknown>, but this class should not prevent an object held by the returned promise from being garbage collected.
        this._currentOperation = new Promise<void>((resolve) => newOperation.then(() => resolve(), resolve));
        return newOperation;
    }

    /**
     * Executes the provided function when all the specified locks are acquired.
     * @param func The function to execute.
     * @param locks The locks to acquire.
     * @param signal An optional signal that can be used to abort the operation.
     * @returns A promise that resolves when the func finishes executing.
     */
    public static async LockAsync<T>(func: () => T | Promise<T>, locks: AsyncLock[], signal?: AbortSignal): Promise<T> {
        signal?.throwIfAborted();

        if (locks.length === 0) {
            return await func();
        }

        const deferred = new Deferred<T>();
        let acquiredLocks = 0;

        for (const lock of locks) {
            lock.lockAsync(async () => {
                acquiredLocks++;
                if (acquiredLocks === locks.length) {
                    deferred.resolve(await func());
                }
                return deferred.promise;
            }, signal).catch((e) => deferred.reject(e));
        }

        return deferred.promise;
    }
}
