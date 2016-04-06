module BABYLON {

    /**
     * A class serves as a medium between the observable and its observers
     */
    export class EventState {

        /**
        * If the callback of a given Observer set skipNextObservers to true the following observers will be ignored
        */
        constructor(public skipNextObservers = false) {
        }
    }

    export class Observer<T> {
        constructor(public callback: (eventData: T, eventState: EventState) => void, public mask:number) {
        }
    }

    export class Observable<T> {
        _observers = new Array<Observer<T>>();

        /**
         * Create a new Observer with the specified callback
         * @param callback the callback that will be executed for that Observer
         * @param mash the mask used to filter observers
         * @param insertFirst if true the callback will be inserted at the first position, hence executed before the others ones. If false (default behavior) the callback will be inserted at the last position, executed after all the others already present.
         */
        public add(callback: (eventData: T, eventState: EventState) => void, mask: number = -1, insertFirst = false): Observer<T> {
            if (!callback) {
                return null;
            }

            var observer = new Observer(callback, mask);

            if (insertFirst) {
                this._observers.unshift(observer);
            } else {
                this._observers.push(observer);
            }

            return observer;
        }

        /**
         * Remove an Observer from the Observable object
         * @param observer the instance of the Observer to remove. If it doesn't belong to this Observable, false will be returned.
         */
        public remove(observer: Observer<T>): boolean {
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
         * @param eventData
         * @param mask
         */
        public notifyObservers(eventData: T, mask:number = -1): void {
            var state = new EventState();

            for (var obs of this._observers) {
                if (obs.mask & mask) {
                    obs.callback(eventData, state);
                }
                if (state.skipNextObservers) {
                    break;
                }
            }
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
        }

        /**
        * Clone the current observable
        */
        public clone(): Observable<T> {
            var result = new Observable<T>();

            result._observers = this._observers.slice(0);

            return result;
        }
    }
}

