/** This file must only contain pure code and pure imports */

import { type Nullable } from "../types";
import { Observable } from "./observable.pure";
import type { Observer, EventState } from "./observable";

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

let _Registered = false;
/**
 * Register side effects for observableExtensions.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterObservableExtensions(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Observable.prototype.notifyObserversWithPromise = async function <T>(eventData: T, mask: number = -1, target?: any, currentTarget?: any, userInfo?: any): Promise<T> {
        // create an empty promise
        let p: Promise<any> = Promise.resolve(eventData);

        // no observers? return this promise.
        if (!this.observers.length) {
            return await p;
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
                    // eslint-disable-next-line github/no-then
                    p = p.then((lastReturnedValue) => {
                        state.lastReturnValue = lastReturnedValue;
                        return obs.callback.apply(obs.scope, [eventData, state]);
                    });
                } else {
                    // eslint-disable-next-line github/no-then
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
}
