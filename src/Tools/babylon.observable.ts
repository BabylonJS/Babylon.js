module BABYLON {
    export class Observer<T> {
        constructor(public callback: (eventData: T) => void) {
        }
    }

    export class Observable<T> {
        _observers = new Array<Observer<T>>();

        /**
         * Create a new Observer with the specified callback
         * @param callback the callback that will be executed for that Observer
         */
        public add(callback: (eventData: T) => void): Observer<T> {
            if (!callback) {
                return null;
            }

            var observer = new Observer(callback);

            this._observers.push(observer);

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
        public removeCallback(callback: (eventData: T) => void): boolean {

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
         */
        public notifyObservers(eventData: T): void {
            this._observers.forEach((observer: Observer<T>) => {
                observer.callback(eventData);
            });
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