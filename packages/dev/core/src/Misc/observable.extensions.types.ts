export {};
declare module "./observable.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Observable<T> {
        /**
         * Calling this will execute each callback, expecting it to be a promise or return a value.
         * If at any point in the chain one function fails, the promise will fail and the execution will not continue.
         * This is useful when a chain of events (sometimes async events) is needed to initialize a certain object
         * and it is crucial that all callbacks will be executed.
         * The order of the callbacks is kept, callbacks are not executed parallel.
         *
         * @param eventData The data to be sent to each callback
         * @param mask is used to filter observers defaults to -1
         * @param target defines the callback target (see EventState)
         * @param currentTarget defines he current object in the bubbling phase
         * @param userInfo defines any user info to send to observers
         * @returns {Promise<T>} will return a Promise than resolves when all callbacks executed successfully.
         */
        notifyObserversWithPromise(eventData: T, mask?: number, target?: any, currentTarget?: any, userInfo?: any): Promise<T>;
    }
}
