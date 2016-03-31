var BABYLON;
(function (BABYLON) {
    /**
     * A class serves as a medium between the observable and its observers
     */
    var EventState = (function () {
        /**
        * If the callback of a given Observer set skipNextObervers to true the following observers will be ignored
        */
        function EventState(skipNextObervers) {
            if (skipNextObervers === void 0) { skipNextObervers = false; }
            this.skipNextObervers = skipNextObervers;
        }
        return EventState;
    }());
    BABYLON.EventState = EventState;
    var Observer = (function () {
        function Observer(callback) {
            this.callback = callback;
        }
        return Observer;
    }());
    BABYLON.Observer = Observer;
    var Observable = (function () {
        function Observable() {
            this._observers = new Array();
        }
        /**
         * Create a new Observer with the specified callback
         * @param callback the callback that will be executed for that Observer
         * @param insertFirst if true the callback will be inserted at the first position, hence executed before the others ones. If false (default behavior) the callback will be inserted at the last position, executed after all the others already present.
         */
        Observable.prototype.add = function (callback, insertFirst) {
            if (insertFirst === void 0) { insertFirst = false; }
            if (!callback) {
                return null;
            }
            var observer = new Observer(callback);
            if (insertFirst) {
                this._observers.unshift(observer);
            }
            else {
                this._observers.push(observer);
            }
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
            var state = new EventState();
            for (var _i = 0, _a = this._observers; _i < _a.length; _i++) {
                var obs = _a[_i];
                obs.callback(eventData, state);
                if (state.skipNextObervers) {
                    break;
                }
            }
        };
        /**
         * return true is the Observable has at least one Observer registered
         */
        Observable.prototype.hasObservers = function () {
            return this._observers.length > 0;
        };
        /**
        * Clear the list of observers
        */
        Observable.prototype.clear = function () {
            this._observers = new Array();
        };
        /**
        * Clone the current observable
        */
        Observable.prototype.clone = function () {
            var result = new Observable();
            result._observers = this._observers.slice(0);
            return result;
        };
        return Observable;
    }());
    BABYLON.Observable = Observable;
})(BABYLON || (BABYLON = {}));
