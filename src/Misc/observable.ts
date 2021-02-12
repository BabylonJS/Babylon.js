import { Nullable } from "../types";

/**
 * A class serves as a medium between the observable and its observers
 */
export class EventState {

    /**
     * Create a new EventState
     * @param mask defines the mask associated with this state
     * @param skipNextObservers defines a flag which will instruct the observable to skip following observers when set to true
     * @param target defines the original target of the state
     * @param currentTarget defines the current target of the state
     */
    constructor(mask: number, skipNextObservers = false, target?: any, currentTarget?: any) {
        this.initialize(mask, skipNextObservers, target, currentTarget);
    }

    /**
     * Initialize the current event state
     * @param mask defines the mask associated with this state
     * @param skipNextObservers defines a flag which will instruct the observable to skip following observers when set to true
     * @param target defines the original target of the state
     * @param currentTarget defines the current target of the state
     * @returns the current event state
     */
    public initialize(mask: number, skipNextObservers = false, target?: any, currentTarget?: any): EventState {
        this.mask = mask;
        this.skipNextObservers = skipNextObservers;
        this.target = target;
        this.currentTarget = currentTarget;
        return this;
    }

    /**
     * An Observer can set this property to true to prevent subsequent observers of being notified
     */
    public skipNextObservers: boolean;

    /**
     * Get the mask value that were used to trigger the event corresponding to this EventState object
     */
    public mask: number;

    /**
     * The object that originally notified the event
     */
    public target?: any;

    /**
     * The current object in the bubbling phase
     */
    public currentTarget?: any;

    /**
     * This will be populated with the return value of the last function that was executed.
     * If it is the first function in the callback chain it will be the event data.
     */
    public lastReturnValue?: any;

     /**
     * User defined information that will be sent to observers
     */
    public userInfo?: any;
}

/**
 * Represent an Observer registered to a given Observable object.
 */
export class Observer<T> {
    /** @hidden */
    public _willBeUnregistered = false;
    /**
     * Gets or sets a property defining that the observer as to be unregistered after the next notification
     */
    public unregisterOnNextCall = false;

    /**
     * Creates a new observer
     * @param callback defines the callback to call when the observer is notified
     * @param mask defines the mask of the observer (used to filter notifications)
     * @param scope defines the current scope used to restore the JS context
     */
    constructor(
        /**
         * Defines the callback to call when the observer is notified
         */
        public callback: (eventData: T, eventState: EventState) => void,
        /**
         * Defines the mask of the observer (used to filter notifications)
         */
        public mask: number,
        /**
         * Defines the current scope used to restore the JS context
         */
        public scope: any = null) {
    }
}

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
            for (var index = 0; index < this._observers.length; index++) {
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
        let result = new MultiObserver<T>();

        result._observers = new Array<Observer<T>>();
        result._observables = observables;

        for (var observable of observables) {
            let observer = observable.add(callback, mask, false, scope);
            if (observer) {
                result._observers.push(observer);
            }
        }

        return result;
    }
}

/**
 * The Observable class is a simple implementation of the Observable pattern.
 *
 * There's one slight particularity though: a given Observable can notify its observer using a particular mask value, only the Observers registered with this mask value will be notified.
 * This enable a more fine grained execution without having to rely on multiple different Observable objects.
 * For instance you may have a given Observable that have four different types of notifications: Move (mask = 0x01), Stop (mask = 0x02), Turn Right (mask = 0X04), Turn Left (mask = 0X08).
 * A given observer can register itself with only Move and Stop (mask = 0x03), then it will only be notified when one of these two occurs and will never be for Turn Left/Right.
 */
export class Observable<T> {
    private _observers = new Array<Observer<T>>();

    private _eventState: EventState;

    private _onObserverAdded: Nullable<(observer: Observer<T>) => void>;

    /**
     * Gets the list of observers
     */
    public get observers(): Array<Observer<T>> {
        return this._observers;
    }

    /**
     * Creates a new observable
     * @param onObserverAdded defines a callback to call when a new observer is added
     */
    constructor(onObserverAdded?: (observer: Observer<T>) => void) {
        this._eventState = new EventState(0);

        if (onObserverAdded) {
            this._onObserverAdded = onObserverAdded;
        }
    }

    /**
     * Create a new Observer with the specified callback
     * @param callback the callback that will be executed for that Observer
     * @param mask the mask used to filter observers
     * @param insertFirst if true the callback will be inserted at the first position, hence executed before the others ones. If false (default behavior) the callback will be inserted at the last position, executed after all the others already present.
     * @param scope optional scope for the callback to be called from
     * @param unregisterOnFirstCall defines if the observer as to be unregistered after the next notification
     * @returns the new observer created for the callback
     */
    public add(callback: (eventData: T, eventState: EventState) => void, mask: number = -1, insertFirst = false, scope: any = null, unregisterOnFirstCall = false): Nullable<Observer<T>> {
        if (!callback) {
            return null;
        }

        var observer = new Observer(callback, mask, scope);
        observer.unregisterOnNextCall = unregisterOnFirstCall;

        if (insertFirst) {
            this._observers.unshift(observer);
        } else {
            this._observers.push(observer);
        }

        if (this._onObserverAdded) {
            this._onObserverAdded(observer);
        }

        return observer;
    }

    /**
     * Create a new Observer with the specified callback and unregisters after the next notification
     * @param callback the callback that will be executed for that Observer
     * @returns the new observer created for the callback
     */
    public addOnce(callback: (eventData: T, eventState: EventState) => void): Nullable<Observer<T>> {
        return this.add(callback, undefined, undefined, undefined, true);
    }

    /**
     * Remove an Observer from the Observable object
     * @param observer the instance of the Observer to remove
     * @returns false if it doesn't belong to this Observable
     */
    public remove(observer: Nullable<Observer<T>>): boolean {
        if (!observer) {
            return false;
        }

        var index = this._observers.indexOf(observer);

        if (index !== -1) {
            this._deferUnregister(observer);
            return true;
        }

        return false;
    }

    /**
     * Remove a callback from the Observable object
     * @param callback the callback to remove
     * @param scope optional scope. If used only the callbacks with this scope will be removed
     * @returns false if it doesn't belong to this Observable
    */
    public removeCallback(callback: (eventData: T, eventState: EventState) => void, scope?: any): boolean {

        for (var index = 0; index < this._observers.length; index++) {
            const observer = this._observers[index];
            if (observer._willBeUnregistered) {
                continue;
            }
            if (observer.callback === callback && (!scope || scope === observer.scope)) {
                this._deferUnregister(observer);
                return true;
            }
        }

        return false;
    }

    private _deferUnregister(observer: Observer<T>): void {
        observer.unregisterOnNextCall = false;
        observer._willBeUnregistered = true;
        setTimeout(() => {
            this._remove(observer);
        }, 0);
    }

    // This should only be called when not iterating over _observers to avoid callback skipping.
    // Removes an observer from the _observer Array.
    private _remove(observer: Nullable<Observer<T>>): boolean {
        if (!observer) {
            return false;
        }

        var index = this._observers.indexOf(observer);

        if (index !== -1) {
            this._observers.splice(index, 1);
            return true;
        }

        return false;
    }

    /**
     * Moves the observable to the top of the observer list making it get called first when notified
     * @param observer the observer to move
     */
    public makeObserverTopPriority(observer: Observer<T>) {
        this._remove(observer);
        this._observers.unshift(observer);
    }

    /**
     * Moves the observable to the bottom of the observer list making it get called last when notified
     * @param observer the observer to move
     */
    public makeObserverBottomPriority(observer: Observer<T>) {
        this._remove(observer);
        this._observers.push(observer);
    }

    /**
     * Notify all Observers by calling their respective callback with the given data
     * Will return true if all observers were executed, false if an observer set skipNextObservers to true, then prevent the subsequent ones to execute
     * @param eventData defines the data to send to all observers
     * @param mask defines the mask of the current notification (observers with incompatible mask (ie mask & observer.mask === 0) will not be notified)
     * @param target defines the original target of the state
     * @param currentTarget defines the current target of the state
     * @param userInfo defines any user info to send to observers
     * @returns false if the complete observer chain was not processed (because one observer set the skipNextObservers to true)
     */
    public notifyObservers(eventData: T, mask: number = -1, target?: any, currentTarget?: any, userInfo?: any): boolean {
        if (!this._observers.length) {
            return true;
        }

        let state = this._eventState;
        state.mask = mask;
        state.target = target;
        state.currentTarget = currentTarget;
        state.skipNextObservers = false;
        state.lastReturnValue = eventData;
        state.userInfo = userInfo;

        for (var obs of this._observers) {
            if (obs._willBeUnregistered) {
                continue;
            }

            if (obs.mask & mask) {
                if (obs.scope) {
                    state.lastReturnValue = obs.callback.apply(obs.scope, [eventData, state]);
                } else {
                    state.lastReturnValue = obs.callback(eventData, state);
                }

                if (obs.unregisterOnNextCall) {
                    this._deferUnregister(obs);
                }
            }
            if (state.skipNextObservers) {
                return false;
            }
        }
        return true;
    }

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
    public notifyObserversWithPromise(eventData: T, mask: number = -1, target?: any, currentTarget?: any, userInfo?: any): Promise<T> {

        // create an empty promise
        let p: Promise<any> = Promise.resolve(eventData);

        // no observers? return this promise.
        if (!this._observers.length) {
            return p;
        }

        let state = this._eventState;
        state.mask = mask;
        state.target = target;
        state.currentTarget = currentTarget;
        state.skipNextObservers = false;
        state.userInfo = userInfo;

        // execute one callback after another (not using Promise.all, the order is important)
        this._observers.forEach((obs) => {
            if (state.skipNextObservers) {
                return;
            }
            if (obs._willBeUnregistered) {
                return;
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
        });

        // return the eventData
        return p.then(() => { return eventData; });
    }

    /**
     * Notify a specific observer
     * @param observer defines the observer to notify
     * @param eventData defines the data to be sent to each callback
     * @param mask is used to filter observers defaults to -1
     */
    public notifyObserver(observer: Observer<T>, eventData: T, mask: number = -1): void {
        if (observer._willBeUnregistered) {
            return;
        }

        let state = this._eventState;
        state.mask = mask;
        state.skipNextObservers = false;

        observer.callback(eventData, state);

        if (observer.unregisterOnNextCall) {
            this._deferUnregister(observer);
        }
    }

    /**
     * Gets a boolean indicating if the observable has at least one observer
     * @returns true is the Observable has at least one Observer registered
     */
    public hasObservers(): boolean {
        return this._observers.length > 0;
    }

    /**
    * Clear the list of observers
    */
    public clear(): void {
        this._observers = new Array<Observer<T>>();
        this._onObserverAdded = null;
    }

    /**
     * Clone the current observable
     * @returns a new observable
     */
    public clone(): Observable<T> {
        var result = new Observable<T>();

        result._observers = this._observers.slice(0);

        return result;
    }

    /**
     * Does this observable handles observer registered with a given mask
     * @param mask defines the mask to be tested
     * @return whether or not one observer registered with the given mask is handled
    **/
    public hasSpecificMask(mask: number = -1): boolean {
        for (var obs of this._observers) {
            if (obs.mask & mask || obs.mask === mask) {
                return true;
            }
        }
        return false;
    }
}
