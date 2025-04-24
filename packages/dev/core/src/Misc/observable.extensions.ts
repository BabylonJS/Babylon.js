import type { Nullable } from "../types";
import type { Observer, EventState } from "./observable";
import { Observable } from "./observable";

/**
 * Represent a list of observers registered to multiple Observables object.
 */
export class MultiObserver<T> {
    private _observers: Nullable<Observer<T>[]>;
    private _observables: Nullable<Observable<T>[]>;

    /**
     * Release associated resources
     */
    public dispose(): void {
        if (this._observers && this._observables) {
            for (let index = 0; index < this._observers.length; index++) {
                this._observables[index].remove(this._observers[index]);
            }
        }

        this._observers = null;
        this._observables = null;
    }

    /**
     * Raise a callback when one of the observable will notify
     * @param observables defines a list of observables to watch
     * @param callback defines the callback to call on notification
     * @param mask defines the mask used to filter notifications
     * @param scope defines the current scope used to restore the JS context
     * @returns the new MultiObserver
     */
    public static Watch<T>(observables: Observable<T>[], callback: (eventData: T, eventState: EventState) => void, mask: number = -1, scope: any = null): MultiObserver<T> {
        const result = new MultiObserver<T>();

        result._observers = new Array<Observer<T>>();
        result._observables = observables;

        for (const observable of observables) {
            const observer = observable.add(callback, mask, false, scope);
            if (observer) {
                result._observers.push(observer);
            }
        }

        return result;
    }
}

declare module "./observable" {
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

Observable.prototype.notifyObserversWithPromise = async function <T>(eventData: T, mask: number = -1, target?: any, currentTarget?: any, userInfo?: any): Promise<T> {
    // create an empty promise
    let p: Promise<any> = Promise.resolve(eventData);

    // no observers? return this promise.
    if (!this.observers.length) {
        return p;
    }

    const state = this._eventState;
    state.mask = mask;
    state.target = target;
    state.currentTarget = currentTarget;
    state.skipNextObservers = false;
    state.userInfo = userInfo;

    // execute one callback after another (not using Promise.all, the order is important)
    for (const obs of this.observers) {
        if (state.skipNextObservers) {
            continue;
        }
        if (obs._willBeUnregistered) {
            continue;
        }
        if (obs.mask & mask) {
            if (obs.scope) {
                p = p.then((lastReturnedValue) => {
                    state.lastReturnValue = lastReturnedValue;
                    return obs.callback.apply(obs.scope, [eventData, state]);
                });
            } else {
                p = p.then((lastReturnedValue) => {
                    state.lastReturnValue = lastReturnedValue;
                    return obs.callback(eventData, state);
                });
            }
            if (obs.unregisterOnNextCall) {
                this._deferUnregister(obs);
            }
        }
    }

    // return the eventData
    await p;
    return eventData;
};
