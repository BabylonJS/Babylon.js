var BABYLON;
(function (BABYLON) {
    /**
     * A class serves as a medium between the observable and its observers
     */
    var EventState = (function () {
        /**
        * If the callback of a given Observer set skipNextObservers to true the following observers will be ignored
        */
        function EventState(mask, skipNextObservers) {
            if (skipNextObservers === void 0) { skipNextObservers = false; }
            this.initalize(mask, skipNextObservers);
        }
        EventState.prototype.initalize = function (mask, skipNextObservers) {
            if (skipNextObservers === void 0) { skipNextObservers = false; }
            this.mask = mask;
            this.skipNextObservers = skipNextObservers;
            return this;
        };
        return EventState;
    }());
    BABYLON.EventState = EventState;
    /**
     * Represent an Observer registered to a given Observable object.
     */
    var Observer = (function () {
        function Observer(callback, mask) {
            this.callback = callback;
            this.mask = mask;
        }
        return Observer;
    }());
    BABYLON.Observer = Observer;
    /**
     * The Observable class is a simple implementation of the Observable pattern.
     * There's one slight particularity though: a given Observable can notify its observer using a particular mask value, only the Observers registered with this mask value will be notified.
     * This enable a more fine grained execution without having to rely on multiple different Observable objects.
     * For instance you may have a given Observable that have four different types of notifications: Move (mask = 0x01), Stop (mask = 0x02), Turn Right (mask = 0X04), Turn Left (mask = 0X08).
     * A given observer can register itself with only Move and Stop (mask = 0x03), then it will only be notified when one of these two occurs and will never be for Turn Left/Right.
     */
    var Observable = (function () {
        function Observable() {
            this._observers = new Array();
            this._eventState = new EventState(0);
        }
        /**
         * Create a new Observer with the specified callback
         * @param callback the callback that will be executed for that Observer
         * @param mask the mask used to filter observers
         * @param insertFirst if true the callback will be inserted at the first position, hence executed before the others ones. If false (default behavior) the callback will be inserted at the last position, executed after all the others already present.
         */
        Observable.prototype.add = function (callback, mask, insertFirst) {
            if (mask === void 0) { mask = -1; }
            if (insertFirst === void 0) { insertFirst = false; }
            if (!callback) {
                return null;
            }
            var observer = new Observer(callback, mask);
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
         * Will return true if all observers were executed, false if an observer set skipNextObservers to true, then prevent the subsequent ones to execute
         * @param eventData
         * @param mask
         */
        Observable.prototype.notifyObservers = function (eventData, mask) {
            if (mask === void 0) { mask = -1; }
            var state = this._eventState;
            state.mask = mask;
            state.skipNextObservers = false;
            for (var _i = 0, _a = this._observers; _i < _a.length; _i++) {
                var obs = _a[_i];
                if (obs.mask & mask) {
                    obs.callback(eventData, state);
                }
                if (state.skipNextObservers) {
                    return false;
                }
            }
            return true;
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
