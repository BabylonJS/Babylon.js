var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * Custom type of the propertyChanged observable
     */
    var PropertyChangedInfo = (function () {
        function PropertyChangedInfo() {
        }
        return PropertyChangedInfo;
    }());
    BABYLON.PropertyChangedInfo = PropertyChangedInfo;
    /**
     * The purpose of this class is to provide a base implementation of the IPropertyChanged interface for the user to avoid rewriting a code needlessly.
     * Typical use of this class is to check for equality in a property set(), then call the onPropertyChanged method if values are different after the new value is set. The protected method will notify observers of the change.
     * Remark: onPropertyChanged detects reentrant code and acts in a way to make sure everything is fine, fast and allocation friendly (when there no reentrant code which should be 99% of the time)
     */
    var PropertyChangedBase = (function () {
        function PropertyChangedBase() {
            this._propertyChanged = null;
        }
        /**
         * Protected method to call when there's a change of value in a property set
         * @param propName the name of the concerned property
         * @param oldValue its old value
         * @param newValue its new value
         * @param mask an optional observable mask
         */
        PropertyChangedBase.prototype.onPropertyChanged = function (propName, oldValue, newValue, mask) {
            if (this.propertyChanged.hasObservers()) {
                var pci = PropertyChangedBase.calling ? new PropertyChangedInfo() : PropertyChangedBase.pci;
                pci.oldValue = oldValue;
                pci.newValue = newValue;
                pci.propertyName = propName;
                try {
                    PropertyChangedBase.calling = true;
                    this.propertyChanged.notifyObservers(pci, mask);
                }
                finally {
                    PropertyChangedBase.calling = false;
                }
            }
        };
        Object.defineProperty(PropertyChangedBase.prototype, "propertyChanged", {
            /**
             * An observable that is triggered when a property (using of the XXXXLevelProperty decorator) has its value changing.
             * You can add an observer that will be triggered only for a given set of Properties using the Mask feature of the Observable and the corresponding Prim2DPropInfo.flagid value (e.g. Prim2DBase.positionProperty.flagid|Prim2DBase.rotationProperty.flagid to be notified only about position or rotation change)
             */
            get: function () {
                if (!this._propertyChanged) {
                    this._propertyChanged = new BABYLON.Observable();
                }
                return this._propertyChanged;
            },
            enumerable: true,
            configurable: true
        });
        PropertyChangedBase.pci = new PropertyChangedInfo();
        PropertyChangedBase.calling = false;
        return PropertyChangedBase;
    }());
    BABYLON.PropertyChangedBase = PropertyChangedBase;
    /**
     * Class for the ObservableArray.onArrayChanged observable
     */
    var ArrayChanged = (function () {
        function ArrayChanged() {
            this.action = 0;
            this.newItems = new Array();
            this.removedItems = new Array();
            this.changedItems = new Array();
            this.newStartingIndex = -1;
            this.removedStartingIndex = -1;
        }
        Object.defineProperty(ArrayChanged, "clearAction", {
            /**
             * The content of the array was totally cleared
             */
            get: function () {
                return ArrayChanged._clearAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "newItemsAction", {
            /**
             * A new item was added, the newItems field contains the key/value pairs
             */
            get: function () {
                return ArrayChanged._newItemsAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "removedItemsAction", {
            /**
             * An existing item was removed, the removedKey field contains its key
             */
            get: function () {
                return ArrayChanged._removedItemsAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "changedItemAction", {
            /**
             * One or many items in the array were changed, the
             */
            get: function () {
                return ArrayChanged._changedItemAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "replacedArrayAction", {
            /**
             * The array's content was totally changed
             * Depending on the method that used this mode the ChangedArray object may contains more information
             */
            get: function () {
                return ArrayChanged._replacedArrayAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "lengthChangedAction", {
            /**
             * The length of the array changed
             */
            get: function () {
                return ArrayChanged._lengthChangedAction;
            },
            enumerable: true,
            configurable: true
        });
        ArrayChanged.prototype.clear = function () {
            this.action = 0;
            this.newItems.splice(0);
            this.removedItems.splice(0);
            this.changedItems.splice(0);
            this.removedStartingIndex = this.removedStartingIndex = this.changedStartingIndex = 0;
        };
        ArrayChanged._clearAction = 0x1;
        ArrayChanged._newItemsAction = 0x2;
        ArrayChanged._removedItemsAction = 0x4;
        ArrayChanged._replacedArrayAction = 0x8;
        ArrayChanged._lengthChangedAction = 0x10;
        ArrayChanged._changedItemAction = 0x20;
        return ArrayChanged;
    }());
    BABYLON.ArrayChanged = ArrayChanged;
    var OAWatchedObjectChangedInfo = (function () {
        function OAWatchedObjectChangedInfo() {
        }
        return OAWatchedObjectChangedInfo;
    }());
    BABYLON.OAWatchedObjectChangedInfo = OAWatchedObjectChangedInfo;
    /**
     * This class mimics the Javascript Array and TypeScript Array<T> classes, adding new features concerning the Observable pattern.
     *
     */
    var ObservableArray = (function (_super) {
        __extends(ObservableArray, _super);
        /**
         * Create an Observable Array.
         * @param watchObjectsPropertyChange
         * @param array and optional array that will be encapsulated by this ObservableArray instance. That's right, it's NOT a copy!
         */
        function ObservableArray(watchObjectsPropertyChange, array) {
            _super.call(this);
            this.dci = new ArrayChanged();
            this._callingArrayChanged = false;
            this._array = (array != null) ? array : new Array();
            this.dci = new ArrayChanged();
            this._callingArrayChanged = false;
            this._arrayChanged = null;
            this._callingWatchedObjectChanged = false;
            this._watchObjectsPropertyChange = watchObjectsPropertyChange;
            this._watchedObjectList = this._watchObjectsPropertyChange ? new BABYLON.StringDictionary() : null;
            this._woci = new OAWatchedObjectChangedInfo();
        }
        Object.defineProperty(ObservableArray.prototype, "length", {
            /**
              * Gets or sets the length of the array. This is a number one higher than the highest element defined in an array.
              */
            get: function () {
                return this._array.length;
            },
            set: function (value) {
                if (value === this._array.length) {
                    return;
                }
                var oldLength = this._array.length;
                this._array.length = value;
                this.onPropertyChanged("length", oldLength, this._array.length);
            },
            enumerable: true,
            configurable: true
        });
        ObservableArray.prototype.getAt = function (index) {
            return this._array[index];
        };
        ObservableArray.prototype.setAt = function (index, value) {
            if (index < 0) {
                return false;
            }
            var insertion = (index >= this._array.length) || this._array[index] === undefined;
            var oldLength = 0;
            if (insertion) {
                oldLength = this._array.length;
            }
            else if (this._watchObjectsPropertyChange) {
                this._removeWatchedElement(this._array[index]);
            }
            this._array[index] = value;
            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement(value);
            }
            if (insertion) {
                this.onPropertyChanged("length", oldLength, this._array.length);
            }
            var ac = this.getArrayChangedObject();
            if (ac) {
                ac.action = insertion ? ArrayChanged.newItemsAction : ArrayChanged.changedItemAction;
                if (insertion) {
                    ac.newItems.splice(0, ac.newItems.length, { index: index, value: value });
                    ac.newStartingIndex = index;
                    ac.changedItems.splice(0);
                }
                else {
                    ac.newItems.splice(0);
                    ac.changedStartingIndex = index;
                    ac.changedItems.splice(0, ac.changedItems.length, { index: index, value: value });
                }
                ac.removedItems.splice(0);
                ac.removedStartingIndex = -1;
                this.callArrayChanged(ac);
            }
        };
        /**
          * Returns a string representation of an array.
          */
        ObservableArray.prototype.toString = function () {
            return this._array.toString();
        };
        ObservableArray.prototype.toLocaleString = function () {
            return this._array.toLocaleString();
        };
        /**
          * Appends new elements to an array, and returns the new length of the array.
          * @param items New elements of the Array.
          */
        ObservableArray.prototype.push = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i - 0] = arguments[_i];
            }
            var oldLength = this._array.length;
            var n = (_a = this._array).push.apply(_a, items);
            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement.apply(this, items);
            }
            this.onPropertyChanged("length", oldLength, this._array.length);
            var ac = this.getArrayChangedObject();
            if (ac) {
                ac.action = ArrayChanged.newItemsAction;
                ac.newStartingIndex = oldLength;
                this.feedNotifArray.apply(this, [ac.newItems, oldLength].concat(items));
                this.callArrayChanged(ac);
            }
            return n;
            var _a;
        };
        /**
          * Removes the last element from an array and returns it.
          */
        ObservableArray.prototype.pop = function () {
            var firstRemove = this._array.length - 1;
            var res = this._array.pop();
            if (res && this._watchObjectsPropertyChange) {
                this._removeWatchedElement(res);
            }
            if (firstRemove !== -1) {
                this.onPropertyChanged("length", this._array.length + 1, this._array.length);
                var ac = this.getArrayChangedObject();
                if (ac) {
                    ac.action = ArrayChanged.removedItemsAction;
                    ac.removedStartingIndex = firstRemove;
                    this.feedNotifArray(ac.removedItems, firstRemove, res);
                }
            }
            return res;
        };
        /**
          * Combines two or more arrays.
          * @param items Additional items to add to the end of array1.
          */
        ObservableArray.prototype.concat = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i - 0] = arguments[_i];
            }
            return new ObservableArray(this._watchObjectsPropertyChange, (_a = this._array).concat.apply(_a, items));
            var _a;
        };
        /**
          * Adds all the elements of an array separated by the specified separator string.
          * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
          */
        ObservableArray.prototype.join = function (separator) {
            return this._array.join(separator);
        };
        /**
          * Reverses the elements in an Array.
         * The arrayChanged action is
          */
        ObservableArray.prototype.reverse = function () {
            var res = this._array.reverse();
            var ac = this.getArrayChangedObject();
            ac.action = ArrayChanged.replacedArrayAction;
            return res;
        };
        /**
          * Removes the first element from an array and returns it, shift all subsequents element one element before.
         * The ArrayChange action is replacedArrayAction, the whole array changes and must be reevaluate as such, the removed element is in removedItems.
         *
          */
        ObservableArray.prototype.shift = function () {
            var oldLength = this._array.length;
            var res = this._array.shift();
            if (this._watchedObjectChanged && res != null) {
                this._removeWatchedElement(res);
            }
            if (oldLength !== 0) {
                this.onPropertyChanged("length", oldLength, this._array.length);
                var ac = this.getArrayChangedObject();
                if (ac) {
                    ac.action = ArrayChanged.replacedArrayAction;
                    ac.removedItems.splice(0, ac.removedItems.length, { index: 0, value: res });
                    ac.newItems.splice(0);
                    ac.changedItems.splice(0);
                    ac.removedStartingIndex = 0;
                    this.callArrayChanged(ac);
                }
            }
            return res;
        };
        /**
          * Returns a section of an array.
          * @param start The beginning of the specified portion of the array.
          * @param end The end of the specified portion of the array.
          */
        ObservableArray.prototype.slice = function (start, end) {
            return new ObservableArray(this._watchObjectsPropertyChange, this._array.slice(start, end));
        };
        /**
          * Sorts an array.
          * @param compareFn The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
         * On the contrary of the Javascript Array's implementation, this method returns nothing
          */
        ObservableArray.prototype.sort = function (compareFn) {
            var oldLength = this._array.length;
            this._array.sort(compareFn);
            if (oldLength !== 0) {
                var ac = this.getArrayChangedObject();
                if (ac) {
                    ac.clear();
                    ac.action = ArrayChanged.replacedArrayAction;
                    this.callArrayChanged(ac);
                }
            }
        };
        /**
          * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
          * @param start The zero-based location in the array from which to start removing elements.
          * @param deleteCount The number of elements to remove.
          * @param items Elements to insert into the array in place of the deleted elements.
          */
        ObservableArray.prototype.splice = function (start, deleteCount) {
            var items = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                items[_i - 2] = arguments[_i];
            }
            var oldLength = this._array.length;
            if (this._watchObjectsPropertyChange) {
                for (var i = start; i < start + deleteCount; i++) {
                    var val = this._array[i];
                    if (this._watchObjectsPropertyChange && val != null) {
                        this._removeWatchedElement(val);
                    }
                }
            }
            var res = (_a = this._array).splice.apply(_a, [start, deleteCount].concat(items));
            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement.apply(this, items);
            }
            if (oldLength !== this._array.length) {
                this.onPropertyChanged("length", oldLength, this._array.length);
            }
            var ac = this.getArrayChangedObject();
            if (ac) {
                ac.clear();
                ac.action = ArrayChanged.replacedArrayAction;
                this.callArrayChanged(ac);
            }
            return res;
            var _a;
        };
        /**
          * Inserts new elements at the start of an array.
          * @param items  Elements to insert at the start of the Array.
          * The ChangedArray action is replacedArrayAction, newItems contains the list of the added items
          */
        ObservableArray.prototype.unshift = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i - 0] = arguments[_i];
            }
            var oldLength = this._array.length;
            var res = (_a = this._array).unshift.apply(_a, items);
            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement.apply(this, items);
            }
            this.onPropertyChanged("length", oldLength, this._array.length);
            var ac = this.getArrayChangedObject();
            if (ac) {
                ac.clear();
                ac.action = ArrayChanged.replacedArrayAction;
                ac.newStartingIndex = 0,
                    this.feedNotifArray.apply(this, [ac.newItems, 0].concat(items));
                this.callArrayChanged(ac);
            }
            return res;
            var _a;
        };
        /**
          * Returns the index of the first occurrence of a value in an array.
          * @param searchElement The value to locate in the array.
          * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
          */
        ObservableArray.prototype.indexOf = function (searchElement, fromIndex) {
            return this._array.indexOf(searchElement, fromIndex);
        };
        /**
          * Returns the index of the last occurrence of a specified value in an array.
          * @param searchElement The value to locate in the array.
          * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
          */
        ObservableArray.prototype.lastIndexOf = function (searchElement, fromIndex) {
            return this._array.lastIndexOf(searchElement, fromIndex);
        };
        /**
          * Determines whether all the members of an array satisfy the specified test.
          * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.every = function (callbackfn, thisArg) {
            return this._array.every(callbackfn, thisArg);
        };
        /**
          * Determines whether the specified callback function returns true for any element of an array.
          * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.some = function (callbackfn, thisArg) {
            return this._array.some(callbackfn, thisArg);
        };
        /**
          * Performs the specified action for each element in an array.
          * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
          * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.forEach = function (callbackfn, thisArg) {
            return this._array.forEach(callbackfn, thisArg);
        };
        /**
          * Calls a defined callback function on each element of an array, and returns an array that contains the results.
          * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.map = function (callbackfn, thisArg) {
            return this._array.map(callbackfn, thisArg);
        };
        /**
          * Returns the elements of an array that meet the condition specified in a callback function.
          * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.filter = function (callbackfn, thisArg) {
            return this._array.filter(callbackfn, thisArg);
        };
        /**
          * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
          * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
          * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
          */
        ObservableArray.prototype.reduce = function (callbackfn, initialValue) {
            return this._array.reduce(callbackfn);
        };
        /**
          * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
          * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
          * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
          */
        ObservableArray.prototype.reduceRight = function (callbackfn, initialValue) {
            return this._array.reduceRight(callbackfn);
        };
        Object.defineProperty(ObservableArray.prototype, "arrayChanged", {
            get: function () {
                if (!this._arrayChanged) {
                    this._arrayChanged = new BABYLON.Observable();
                }
                return this._arrayChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableArray.prototype.getArrayChangedObject = function () {
            if (this._arrayChanged && this._arrayChanged.hasObservers()) {
                var ac = this._callingArrayChanged ? new ArrayChanged() : this.dci;
                return ac;
            }
            return null;
        };
        ObservableArray.prototype.feedNotifArray = function (array, startindIndex) {
            var items = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                items[_i - 2] = arguments[_i];
            }
            array.splice(0);
            for (var i = 0; i < items.length; i++) {
                var value = this._array[i + startindIndex];
                if (value !== undefined) {
                    array.push({ index: i + startindIndex, value: value });
                }
            }
        };
        ObservableArray.prototype.callArrayChanged = function (ac) {
            try {
                this._callingArrayChanged = true;
                this.arrayChanged.notifyObservers(ac, ac.action);
            }
            finally {
                this._callingArrayChanged = false;
            }
        };
        Object.defineProperty(ObservableArray.prototype, "watchedObjectChanged", {
            get: function () {
                if (!this._watchedObjectChanged) {
                    this._watchedObjectChanged = new BABYLON.Observable();
                }
                return this._watchedObjectChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableArray.prototype._addWatchedElement = function () {
            var _this = this;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i - 0] = arguments[_i];
            }
            var _loop_1 = function(curItem) {
                if (curItem["propertyChanged"]) {
                    var key_1 = curItem["__ObsArrayObjID__"];
                    // The object may already be part of another ObsArray, so there already be a valid ID
                    if (!key_1) {
                        key_1 = BABYLON.Tools.RandomId();
                        curItem["__ObsArrayObjID__"] = key_1;
                    }
                    this_1._watchedObjectList.add(key_1, curItem.propertyChanged.add(function (e, d) {
                        _this.onWatchedObjectChanged(key_1, curItem, e);
                    }));
                }
            };
            var this_1 = this;
            for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
                var curItem = items_1[_a];
                _loop_1(curItem);
            }
        };
        ObservableArray.prototype._removeWatchedElement = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i - 0] = arguments[_i];
            }
            for (var _a = 0, items_2 = items; _a < items_2.length; _a++) {
                var curItem = items_2[_a];
                var key = curItem["__ObsArrayObjID__"];
                if (key != null) {
                    var observer = this._watchedObjectList.getAndRemove(key);
                    curItem.propertyChanged.remove(observer);
                }
            }
        };
        ObservableArray.prototype.onWatchedObjectChanged = function (key, object, propChanged) {
            if (this._watchedObjectChanged && this._watchedObjectChanged.hasObservers()) {
                var woci = this._callingWatchedObjectChanged ? new OAWatchedObjectChangedInfo() : this._woci;
                woci.object = object;
                woci.propertyChanged = propChanged;
                try {
                    this._callingWatchedObjectChanged = true;
                    this.watchedObjectChanged.notifyObservers(woci);
                }
                finally {
                    this._callingWatchedObjectChanged = false;
                }
            }
        };
        return ObservableArray;
    }(PropertyChangedBase));
    BABYLON.ObservableArray = ObservableArray;
})(BABYLON || (BABYLON = {}));
