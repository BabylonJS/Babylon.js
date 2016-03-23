var BABYLON;
(function (BABYLON) {
    var Observer = (function () {
        function Observer(callback) {
            this.callback = callback;
        }
        return Observer;
    })();
    BABYLON.Observer = Observer;
    var Observable = (function () {
        function Observable() {
            this._observers = new Array();
        }
        /**
         * Create a new Observer with the specified callback
         * @param callback the callback that will be executed for that Observer
         */
        Observable.prototype.add = function (callback) {
            var observer = new Observer(callback);
            this._observers.push(observer);
            return observer;
        };
        /**
         * Remove an Observer from the Observable object
         * @param observer the instance of the Observer to remove. If it doesn't belong to this Observable, false will be returned.
         */
        Observable.prototype.remove = function (observer) {
            var index = this._observers.indexOf(observer);
            if (index !== -1) {
                this._observers.splice(index, 1);
                return true;
            }
            return false;
        };
        /**
         * Remove a callback from the Observable object
         * @param callback the callback to remove. If it doesn't belong to this Observable, false will be returned.
        */
        Observable.prototype.removeCallback = function (callback) {
            for (var index = 0; index < this._observers.length; index++) {
                if (this._observers[index].callback === callback) {
                    this._observers.splice(index, 1);
                    return true;
                }
            }
            return false;
        };
        /**
         * Notify all Observers by calling their respective callback with the given data
         * @param eventData
         */
        Observable.prototype.notifyObservers = function (eventData) {
            this._observers.forEach(function (observer) {
                observer.callback(eventData);
            });
        };
        /**
        * Clear the list of observers
        */
        Observable.prototype.clear = function () {
            this._observers = new Array();
        };
        return Observable;
    })();
    BABYLON.Observable = Observable;
})(BABYLON || (BABYLON = {}));
