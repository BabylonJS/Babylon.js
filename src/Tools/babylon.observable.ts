module BABYLON {

    /**
     * A class serves as a medium between the observable and its observers
     */
    export class EventState {

        /**
        * If the callback of a given Observer set skipNextObservers to true the following observers will be ignored
        */
        constructor(mask: number, skipNextObservers = false, target?: any, currentTarget?: any) {
            this.initalize(mask, skipNextObservers, target, currentTarget);
        }

        public initalize(mask: number, skipNextObservers = false, target?: any, currentTarget?: any): EventState {
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
    }

    /**
     * Represent an Observer registered to a given Observable object.
     */
    export class Observer<T> {
        constructor(public callback: (eventData: T, eventState: EventState) => void, public mask: number, public scope: any = null) {
        }
    }

    /**
     * Represent a list of observers registered to multiple Observables object.
     */
    export class MultiObserver<T> {
        private _observers: Nullable<Observer<T>[]>;
        private _observables: Nullable<Observable<T>[]>;
        
        public dispose(): void {
            if (this._observers && this._observables) {
                for (var index = 0; index < this._observers.length; index++) {
                    this._observables[index].remove(this._observers[index]);
                }
            }

            this._observers = null;
            this._observables = null;
        }

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
     * There's one slight particularity though: a given Observable can notify its observer using a particular mask value, only the Observers registered with this mask value will be notified.
     * This enable a more fine grained execution without having to rely on multiple different Observable objects.
     * For instance you may have a given Observable that have four different types of notifications: Move (mask = 0x01), Stop (mask = 0x02), Turn Right (mask = 0X04), Turn Left (mask = 0X08).
     * A given observer can register itself with only Move and Stop (mask = 0x03), then it will only be notified when one of these two occurs and will never be for Turn Left/Right.
     */
    export class Observable<T> {
        _observers = new Array<Observer<T>>();

        private _eventState: EventState;

        private _onObserverAdded: Nullable<(observer: Observer<T>) => void>;

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
         */
        public add(callback: (eventData: T, eventState: EventState) => void, mask: number = -1, insertFirst = false, scope: any = null): Nullable<Observer<T>> {
            if (!callback) {
                return null;
            }

            var observer = new Observer(callback, mask, scope);

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
         * Remove an Observer from the Observable object
         * @param observer the instance of the Observer to remove. If it doesn't belong to this Observable, false will be returned.
         */
        public remove(observer: Nullable<Observer<T>>): boolean {
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
         * Remove a callback from the Observable object
         * @param callback the callback to remove. If it doesn't belong to this Observable, false will be returned.
        */
        public removeCallback(callback: (eventData: T, eventState: EventState) => void): boolean {

            for (var index = 0; index < this._observers.length; index++) {
                if (this._observers[index].callback === callback) {
                    this._observers.splice(index, 1);
                    return true;
                }
            }

            return false;
        }

        /**
         * Notify all Observers by calling their respective callback with the given data
         * Will return true if all observers were executed, false if an observer set skipNextObservers to true, then prevent the subsequent ones to execute
         * @param eventData
         * @param mask
         */
        public notifyObservers(eventData: T, mask: number = -1, target?: any, currentTarget?: any): boolean {
            if (!this._observers.length) {
                return true;
            }

            let state = this._eventState;
            state.mask = mask;
            state.target = target;
            state.currentTarget = currentTarget;
            state.skipNextObservers = false;

            for (var obs of this._observers) {
                if (obs.mask & mask) {
                    if(obs.scope){
                        obs.callback.apply(obs.scope, [eventData, state])
                    }else{
                        obs.callback(eventData, state);
                    }
                }
                if (state.skipNextObservers) {
                    return false;
                }
            }
            return true;
        }

        /**
         * Notify a specific observer
         * @param eventData
         * @param mask
         */
        public notifyObserver(observer: Observer<T>, eventData: T, mask: number = -1): void {
            let state = this._eventState;
            state.mask = mask;
            state.skipNextObservers = false;

            observer.callback(eventData, state);
        }        

        /**
         * return true is the Observable has at least one Observer registered
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
        */
        public clone(): Observable<T> {
            var result = new Observable<T>();

            result._observers = this._observers.slice(0);

            return result;
        }

        /**
         * Does this observable handles observer registered with a given mask
         * @param {number} trigger - the mask to be tested
         * @return {boolean} whether or not one observer registered with the given mask is handeled 
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

}