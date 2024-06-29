/**
 * Provides a simple way of creating the rough equivalent of an async critical section.
 *
 * @example
 * const myLock = new AsyncLock();
 *
 * private async MyFuncAsync(): Promise<void> {
 *   await myLock.lockAsync(async () => {
 *     await operation1Async();
 *     await operation2Async();
 *   });
 * }
 */
export class AsyncLock {
    private _currentOperation: Promise<unknown> = Promise.resolve();

    /**
     * Executes the func when the lock is acquired (e.g. when the previous operation finishes).
     * @param func The function to execute.
     * @returns A promise that resolves when the func finishes executing.
     */
    public lockAsync<T>(func: () => T | Promise<T>): Promise<T> {
        const newOperation = this._currentOperation.then(func, func);
        this._currentOperation = newOperation;
        return newOperation;
    }
}
