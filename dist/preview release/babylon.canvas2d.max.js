var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __extends = (this && this.__extends) || function (d, b) {
for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
function __() { this.constructor = d; }
__.prototype = b.prototype;
d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
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
})(BABYLON || (BABYLON = {}));


var BABYLON;
(function (BABYLON) {
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
    }(BABYLON.PropertyChangedBase));
    BABYLON.ObservableArray = ObservableArray;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    /**
     * Class for the ObservableStringDictionary.onDictionaryChanged observable
     */
    var DictionaryChanged = (function () {
        function DictionaryChanged() {
        }
        Object.defineProperty(DictionaryChanged, "clearAction", {
            /**
             * The content of the dictionary was totally cleared
             */
            get: function () {
                return DictionaryChanged._clearAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DictionaryChanged, "newItemAction", {
            /**
             * A new item was added, the newItem field contains the key/value pair
             */
            get: function () {
                return DictionaryChanged._newItemAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DictionaryChanged, "removedItemAction", {
            /**
             * An existing item was removed, the removedKey field contains its key
             */
            get: function () {
                return DictionaryChanged._removedItemAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DictionaryChanged, "itemValueChangedAction", {
            /**
             * An existing item had a value change, the changedItem field contains the key/value
             */
            get: function () {
                return DictionaryChanged._itemValueChangedAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DictionaryChanged, "replacedAction", {
            /**
             * The dictionary's content was reset and replaced by the content of another dictionary.
             * DictionaryChanged<T> contains no further information about this action
             */
            get: function () {
                return DictionaryChanged._replacedAction;
            },
            enumerable: true,
            configurable: true
        });
        DictionaryChanged._clearAction = 0x1;
        DictionaryChanged._newItemAction = 0x2;
        DictionaryChanged._removedItemAction = 0x4;
        DictionaryChanged._itemValueChangedAction = 0x8;
        DictionaryChanged._replacedAction = 0x10;
        return DictionaryChanged;
    }());
    BABYLON.DictionaryChanged = DictionaryChanged;
    var OSDWatchedObjectChangedInfo = (function () {
        function OSDWatchedObjectChangedInfo() {
        }
        return OSDWatchedObjectChangedInfo;
    }());
    BABYLON.OSDWatchedObjectChangedInfo = OSDWatchedObjectChangedInfo;
    var ObservableStringDictionary = (function (_super) {
        __extends(ObservableStringDictionary, _super);
        function ObservableStringDictionary(watchObjectsPropertyChange) {
            _super.call(this);
            this._propertyChanged = null;
            this._dictionaryChanged = null;
            this.dci = new DictionaryChanged();
            this._callingDicChanged = false;
            this._watchedObjectChanged = null;
            this._callingWatchedObjectChanged = false;
            this._woci = new OSDWatchedObjectChangedInfo();
            this._watchObjectsPropertyChange = watchObjectsPropertyChange;
            this._watchedObjectList = this._watchObjectsPropertyChange ? new BABYLON.StringDictionary() : null;
        }
        /**
         * This will clear this dictionary and copy the content from the 'source' one.
         * If the T value is a custom object, it won't be copied/cloned, the same object will be used
         * @param source the dictionary to take the content from and copy to this dictionary
         */
        ObservableStringDictionary.prototype.copyFrom = function (source) {
            var _this = this;
            var oldCount = this.count;
            // Don't rely on this class' implementation for clear/add otherwise tons of notification will be thrown
            _super.prototype.clear.call(this);
            source.forEach(function (t, v) { return _this._add(t, v, false, _this._watchObjectsPropertyChange); });
            this.onDictionaryChanged(DictionaryChanged.replacedAction, null, null, null);
            this.onPropertyChanged("count", oldCount, this.count);
        };
        /**
         * Get a value from its key or add it if it doesn't exist.
         * This method will ensure you that a given key/data will be present in the dictionary.
         * @param key the given key to get the matching value from
         * @param factory the factory that will create the value if the key is not present in the dictionary.
         * The factory will only be invoked if there's no data for the given key.
         * @return the value corresponding to the key.
         */
        ObservableStringDictionary.prototype.getOrAddWithFactory = function (key, factory) {
            var _this = this;
            var val = _super.prototype.getOrAddWithFactory.call(this, key, function (k) {
                var v = factory(key);
                _this._add(key, v, true, _this._watchObjectsPropertyChange);
                return v;
            });
            return val;
        };
        /**
         * Add a new key and its corresponding value
         * @param key the key to add
         * @param value the value corresponding to the key
         * @return true if the operation completed successfully, false if we couldn't insert the key/value because there was already this key in the dictionary
         */
        ObservableStringDictionary.prototype.add = function (key, value) {
            return this._add(key, value, true, true);
        };
        ObservableStringDictionary.prototype.getAndRemove = function (key) {
            var val = _super.prototype.get.call(this, key);
            this._remove(key, true, val);
            return val;
        };
        ObservableStringDictionary.prototype._add = function (key, value, fireNotif, registerWatcher) {
            if (_super.prototype.add.call(this, key, value)) {
                if (fireNotif) {
                    this.onDictionaryChanged(DictionaryChanged.newItemAction, { key: key, value: value }, null, null);
                    this.onPropertyChanged("count", this.count - 1, this.count);
                }
                if (registerWatcher) {
                    this._addWatchedElement(key, value);
                }
                return true;
            }
            return false;
        };
        ObservableStringDictionary.prototype._addWatchedElement = function (key, el) {
            var _this = this;
            if (el["propertyChanged"]) {
                this._watchedObjectList.add(key, el.propertyChanged.add(function (e, d) {
                    _this.onWatchedObjectChanged(key, el, e);
                }));
            }
        };
        ObservableStringDictionary.prototype._removeWatchedElement = function (key, el) {
            var observer = this._watchedObjectList.getAndRemove(key);
            el.propertyChanged.remove(observer);
        };
        ObservableStringDictionary.prototype.set = function (key, value) {
            var oldValue = this.get(key);
            if (this._watchObjectsPropertyChange) {
                this._removeWatchedElement(key, oldValue);
            }
            if (_super.prototype.set.call(this, key, value)) {
                this.onDictionaryChanged(DictionaryChanged.itemValueChangedAction, null, null, { key: key, oldValue: oldValue, newValue: value });
                this._addWatchedElement(key, value);
                return true;
            }
            return false;
        };
        /**
         * Remove a key/value from the dictionary.
         * @param key the key to remove
         * @return true if the item was successfully deleted, false if no item with such key exist in the dictionary
         */
        ObservableStringDictionary.prototype.remove = function (key) {
            return this._remove(key, true);
        };
        ObservableStringDictionary.prototype._remove = function (key, fireNotif, element) {
            if (!element) {
                element = this.get(key);
            }
            if (!element) {
                return false;
            }
            if (_super.prototype.remove.call(this, key) === undefined) {
                return false;
            }
            this.onDictionaryChanged(DictionaryChanged.removedItemAction, null, key, null);
            this.onPropertyChanged("count", this.count + 1, this.count);
            if (this._watchObjectsPropertyChange) {
                this._removeWatchedElement(key, element);
            }
            return true;
        };
        /**
         * Clear the whole content of the dictionary
         */
        ObservableStringDictionary.prototype.clear = function () {
            var _this = this;
            this._watchedObjectList.forEach(function (k, v) {
                var el = _this.get(k);
                _this._removeWatchedElement(k, el);
            });
            this._watchedObjectList.clear();
            var oldCount = this.count;
            _super.prototype.clear.call(this);
            this.onDictionaryChanged(DictionaryChanged.clearAction, null, null, null);
            this.onPropertyChanged("count", oldCount, 0);
        };
        Object.defineProperty(ObservableStringDictionary.prototype, "propertyChanged", {
            get: function () {
                if (!this._propertyChanged) {
                    this._propertyChanged = new BABYLON.Observable();
                }
                return this._propertyChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableStringDictionary.prototype.onPropertyChanged = function (propName, oldValue, newValue, mask) {
            if (this._propertyChanged && this._propertyChanged.hasObservers()) {
                var pci = ObservableStringDictionary.callingPropChanged ? new BABYLON.PropertyChangedInfo() : ObservableStringDictionary.pci;
                pci.oldValue = oldValue;
                pci.newValue = newValue;
                pci.propertyName = propName;
                try {
                    ObservableStringDictionary.callingPropChanged = true;
                    this.propertyChanged.notifyObservers(pci, mask);
                }
                finally {
                    ObservableStringDictionary.callingPropChanged = false;
                }
            }
        };
        Object.defineProperty(ObservableStringDictionary.prototype, "dictionaryChanged", {
            get: function () {
                if (!this._dictionaryChanged) {
                    this._dictionaryChanged = new BABYLON.Observable();
                }
                return this._dictionaryChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableStringDictionary.prototype.onDictionaryChanged = function (action, newItem, removedKey, changedItem) {
            if (this._dictionaryChanged && this._dictionaryChanged.hasObservers()) {
                var dci = this._callingDicChanged ? new DictionaryChanged() : this.dci;
                dci.action = action;
                dci.newItem = newItem;
                dci.removedKey = removedKey;
                dci.changedItem = changedItem;
                try {
                    this._callingDicChanged = true;
                    this.dictionaryChanged.notifyObservers(dci, action);
                }
                finally {
                    this._callingDicChanged = false;
                }
            }
        };
        Object.defineProperty(ObservableStringDictionary.prototype, "watchedObjectChanged", {
            get: function () {
                if (!this._watchedObjectChanged) {
                    this._watchedObjectChanged = new BABYLON.Observable();
                }
                return this._watchedObjectChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableStringDictionary.prototype.onWatchedObjectChanged = function (key, object, propChanged) {
            if (this._watchedObjectChanged && this._watchedObjectChanged.hasObservers()) {
                var woci = this._callingWatchedObjectChanged ? new OSDWatchedObjectChangedInfo() : this._woci;
                woci.key = key;
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
        ObservableStringDictionary.pci = new BABYLON.PropertyChangedInfo();
        ObservableStringDictionary.callingPropChanged = false;
        return ObservableStringDictionary;
    }(BABYLON.StringDictionary));
    BABYLON.ObservableStringDictionary = ObservableStringDictionary;
})(BABYLON || (BABYLON = {}));

var BABYLON;
(function (BABYLON) {
    /**
     * Stores 2D Bounding Information.
     * This class handles a circle area and a bounding rectangle one.
     */
    var BoundingInfo2D = (function () {
        function BoundingInfo2D() {
            this.radius = 0;
            this.center = BABYLON.Vector2.Zero();
            this.extent = BABYLON.Vector2.Zero();
        }
        /**
         * Create a BoundingInfo2D object from a given size
         * @param size the size that will be used to set the extend, radius will be computed from it.
         */
        BoundingInfo2D.CreateFromSize = function (size) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromSizeToRef(size, r);
            return r;
        };
        /**
         * Create a BoundingInfo2D object from a given radius
         * @param radius the radius to use, the extent will be computed from it.
         */
        BoundingInfo2D.CreateFromRadius = function (radius) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromRadiusToRef(radius, r);
            return r;
        };
        /**
         * Create a BoundingInfo2D object from a list of points.
         * The resulted object will be the smallest bounding area that includes all the given points.
         * @param points an array of points to compute the bounding object from.
         */
        BoundingInfo2D.CreateFromPoints = function (points) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromPointsToRef(points, r);
            return r;
        };
        /**
         * Update a BoundingInfo2D object using the given Size as input
         * @param size the bounding data will be computed from this size.
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        BoundingInfo2D.CreateFromSizeToRef = function (size, b) {
            if (!size) {
                size = BABYLON.Size.Zero();
            }
            b.center.x = +size.width / 2;
            b.center.y = +size.height / 2;
            b.extent.x = b.center.x;
            b.extent.y = b.center.y;
            b.radius = b.extent.length();
        };
        /**
         * Update a BoundingInfo2D object using the given radius as input
         * @param radius the bounding data will be computed from this radius
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        BoundingInfo2D.CreateFromRadiusToRef = function (radius, b) {
            b.center.x = b.center.y = 0;
            var r = +radius;
            b.extent.x = r;
            b.extent.y = r;
            b.radius = r;
        };
        /**
         * Update a BoundingInfo2D object using the given points array as input
         * @param points the point array to use to update the bounding data
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        BoundingInfo2D.CreateFromPointsToRef = function (points, b) {
            var xmin = Number.MAX_VALUE, ymin = Number.MAX_VALUE, xmax = Number.MIN_VALUE, ymax = Number.MIN_VALUE;
            for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
                var p = points_1[_i];
                xmin = Math.min(p.x, xmin);
                xmax = Math.max(p.x, xmax);
                ymin = Math.min(p.y, ymin);
                ymax = Math.max(p.y, ymax);
            }
            BoundingInfo2D.CreateFromMinMaxToRef(xmin, xmax, ymin, ymax, b);
        };
        /**
         * Update a BoundingInfo2D object using the given min/max values as input
         * @param xmin the smallest x coordinate
         * @param xmax the biggest x coordinate
         * @param ymin the smallest y coordinate
         * @param ymax the buggest y coordinate
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        BoundingInfo2D.CreateFromMinMaxToRef = function (xmin, xmax, ymin, ymax, b) {
            var w = xmax - xmin;
            var h = ymax - ymin;
            b.center = new BABYLON.Vector2(xmin + w / 2, ymin + h / 2);
            b.extent = new BABYLON.Vector2(xmax - b.center.x, ymax - b.center.y);
            b.radius = b.extent.length();
        };
        /**
         * Duplicate this instance and return a new one
         * @return the duplicated instance
         */
        BoundingInfo2D.prototype.clone = function () {
            var r = new BoundingInfo2D();
            r.center = this.center.clone();
            r.radius = this.radius;
            r.extent = this.extent.clone();
            return r;
        };
        BoundingInfo2D.prototype.clear = function () {
            this.center.copyFromFloats(0, 0);
            this.radius = 0;
            this.extent.copyFromFloats(0, 0);
        };
        BoundingInfo2D.prototype.copyFrom = function (src) {
            this.center.copyFrom(src.center);
            this.radius = src.radius;
            this.extent.copyFrom(src.extent);
        };
        /**
         * return the max extend of the bounding info
         */
        BoundingInfo2D.prototype.max = function () {
            var r = BABYLON.Vector2.Zero();
            this.maxToRef(r);
            return r;
        };
        /**
         * Update a vector2 with the max extend of the bounding info
         * @param result must be a valid/allocated vector2 that will contain the result of the operation
         */
        BoundingInfo2D.prototype.maxToRef = function (result) {
            result.x = this.center.x + this.extent.x;
            result.y = this.center.y + this.extent.y;
        };
        /**
         * Apply a transformation matrix to this BoundingInfo2D and return a new instance containing the result
         * @param matrix the transformation matrix to apply
         * @return the new instance containing the result of the transformation applied on this BoundingInfo2D
         */
        BoundingInfo2D.prototype.transform = function (matrix) {
            var r = new BoundingInfo2D();
            this.transformToRef(matrix, r);
            return r;
        };
        /**
         * Compute the union of this BoundingInfo2D with a given one, returns a new BoundingInfo2D as a result
         * @param other the second BoundingInfo2D to compute the union with this one
         * @return a new instance containing the result of the union
         */
        BoundingInfo2D.prototype.union = function (other) {
            var r = new BoundingInfo2D();
            this.unionToRef(other, r);
            return r;
        };
        /**
         * Transform this BoundingInfo2D with a given matrix and store the result in an existing BoundingInfo2D instance.
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param matrix The matrix to use to compute the transformation
         * @param result A VALID (i.e. allocated) BoundingInfo2D object where the result will be stored
         */
        BoundingInfo2D.prototype.transformToRef = function (matrix, result) {
            // Construct a bounding box based on the extent values
            var p = BoundingInfo2D._transform;
            p[0].x = this.center.x + this.extent.x;
            p[0].y = this.center.y + this.extent.y;
            p[1].x = this.center.x + this.extent.x;
            p[1].y = this.center.y - this.extent.y;
            p[2].x = this.center.x - this.extent.x;
            p[2].y = this.center.y - this.extent.y;
            p[3].x = this.center.x - this.extent.x;
            p[3].y = this.center.y + this.extent.y;
            // Transform the four points of the bounding box with the matrix
            for (var i = 0; i < 4; i++) {
                BABYLON.Vector2.TransformToRef(p[i], matrix, p[i]);
            }
            BoundingInfo2D.CreateFromPointsToRef(p, result);
        };
        /**
         * Compute the union of this BoundingInfo2D with another one and store the result in a third valid BoundingInfo2D object
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param other the second object used to compute the union
         * @param result a VALID BoundingInfo2D instance (i.e. allocated) where the result will be stored
         */
        BoundingInfo2D.prototype.unionToRef = function (other, result) {
            var xmax = Math.max(this.center.x + this.extent.x, other.center.x + other.extent.x);
            var ymax = Math.max(this.center.y + this.extent.y, other.center.y + other.extent.y);
            var xmin = Math.min(this.center.x - this.extent.x, other.center.x - other.extent.x);
            var ymin = Math.min(this.center.y - this.extent.y, other.center.y - other.extent.y);
            BoundingInfo2D.CreateFromMinMaxToRef(xmin, xmax, ymin, ymax, result);
        };
        /**
         * Check if the given point is inside the BoundingInfo.
         * The test is first made on the radius, then inside the rectangle described by the extent
         * @param pickPosition the position to test
         * @return true if the point is inside, false otherwise
         */
        BoundingInfo2D.prototype.doesIntersect = function (pickPosition) {
            // is it inside the radius?
            var pickLocal = pickPosition.subtract(this.center);
            if (pickLocal.lengthSquared() <= (this.radius * this.radius)) {
                // is it inside the rectangle?
                return ((Math.abs(pickLocal.x) <= this.extent.x) && (Math.abs(pickLocal.y) <= this.extent.y));
            }
            return false;
        };
        BoundingInfo2D._transform = new Array(BABYLON.Vector2.Zero(), BABYLON.Vector2.Zero(), BABYLON.Vector2.Zero(), BABYLON.Vector2.Zero());
        return BoundingInfo2D;
    }());
    BABYLON.BoundingInfo2D = BoundingInfo2D;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var LayoutEngineBase = (function () {
        function LayoutEngineBase() {
            this.layoutDirtyOnPropertyChangedMask = 0;
        }
        LayoutEngineBase.prototype.updateLayout = function (prim) {
        };
        Object.defineProperty(LayoutEngineBase.prototype, "isChildPositionAllowed", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        LayoutEngineBase.prototype.isLocked = function () {
            return this._isLocked;
        };
        LayoutEngineBase.prototype.lock = function () {
            if (this._isLocked) {
                return false;
            }
            this._isLocked = true;
            return true;
        };
        LayoutEngineBase = __decorate([
            BABYLON.className("LayoutEngineBase", "BABYLON")
        ], LayoutEngineBase);
        return LayoutEngineBase;
    }());
    BABYLON.LayoutEngineBase = LayoutEngineBase;
    var CanvasLayoutEngine = (function (_super) {
        __extends(CanvasLayoutEngine, _super);
        function CanvasLayoutEngine() {
            _super.apply(this, arguments);
        }
        // A very simple (no) layout computing...
        // The Canvas and its direct children gets the Canvas' size as Layout Area
        // Indirect children have their Layout Area to the actualSize (margin area) of their parent
        CanvasLayoutEngine.prototype.updateLayout = function (prim) {
            // If this prim is layoutDiry we update  its layoutArea and also the one of its direct children
            if (prim._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                for (var _i = 0, _a = prim.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    this._doUpdate(child);
                }
                prim._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
            }
        };
        CanvasLayoutEngine.prototype._doUpdate = function (prim) {
            // Canvas ?
            if (prim instanceof BABYLON.Canvas2D) {
                prim.layoutArea = prim.actualSize;
            }
            else if (prim.parent instanceof BABYLON.Canvas2D) {
                prim.layoutArea = prim.owner.actualSize;
            }
            else {
                prim.layoutArea = prim.parent.contentArea;
            }
        };
        Object.defineProperty(CanvasLayoutEngine.prototype, "isChildPositionAllowed", {
            get: function () {
                return true;
            },
            enumerable: true,
            configurable: true
        });
        CanvasLayoutEngine.Singleton = new CanvasLayoutEngine();
        CanvasLayoutEngine = __decorate([
            BABYLON.className("CanvasLayoutEngine", "BABYLON")
        ], CanvasLayoutEngine);
        return CanvasLayoutEngine;
    }(LayoutEngineBase));
    BABYLON.CanvasLayoutEngine = CanvasLayoutEngine;
    var StackPanelLayoutEngine = (function (_super) {
        __extends(StackPanelLayoutEngine, _super);
        function StackPanelLayoutEngine() {
            _super.call(this);
            this._isHorizontal = true;
            this.layoutDirtyOnPropertyChangedMask = BABYLON.Prim2DBase.sizeProperty.flagId;
        }
        Object.defineProperty(StackPanelLayoutEngine, "Horizontal", {
            get: function () {
                if (!StackPanelLayoutEngine._horizontal) {
                    StackPanelLayoutEngine._horizontal = new StackPanelLayoutEngine();
                    StackPanelLayoutEngine._horizontal.isHorizontal = true;
                    StackPanelLayoutEngine._horizontal.lock();
                }
                return StackPanelLayoutEngine._horizontal;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StackPanelLayoutEngine, "Vertical", {
            get: function () {
                if (!StackPanelLayoutEngine._vertical) {
                    StackPanelLayoutEngine._vertical = new StackPanelLayoutEngine();
                    StackPanelLayoutEngine._vertical.isHorizontal = false;
                    StackPanelLayoutEngine._vertical.lock();
                }
                return StackPanelLayoutEngine._vertical;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StackPanelLayoutEngine.prototype, "isHorizontal", {
            get: function () {
                return this._isHorizontal;
            },
            set: function (val) {
                if (this.isLocked()) {
                    return;
                }
                this._isHorizontal = val;
            },
            enumerable: true,
            configurable: true
        });
        StackPanelLayoutEngine.prototype.updateLayout = function (prim) {
            if (prim._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                var x = 0;
                var y = 0;
                var h = this.isHorizontal;
                var max = 0;
                for (var _i = 0, _a = prim.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (child._isFlagSet(BABYLON.SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }
                    var layoutArea = void 0;
                    if (child._hasMargin) {
                        child.margin.computeWithAlignment(prim.layoutArea, child.actualSize, child.marginAlignment, StackPanelLayoutEngine.dstOffset, StackPanelLayoutEngine.dstArea, true);
                        layoutArea = StackPanelLayoutEngine.dstArea.clone();
                        child.layoutArea = layoutArea;
                    }
                    else {
                        layoutArea = child.layoutArea;
                        child.margin.computeArea(child.actualSize, layoutArea);
                    }
                    max = Math.max(max, h ? layoutArea.height : layoutArea.width);
                }
                for (var _b = 0, _c = prim.children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    if (child._isFlagSet(BABYLON.SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }
                    child.layoutAreaPos = new BABYLON.Vector2(x, y);
                    var layoutArea = child.layoutArea;
                    if (h) {
                        x += layoutArea.width;
                        child.layoutArea = new BABYLON.Size(layoutArea.width, max);
                    }
                    else {
                        y += layoutArea.height;
                        child.layoutArea = new BABYLON.Size(max, layoutArea.height);
                    }
                }
                prim._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
            }
        };
        Object.defineProperty(StackPanelLayoutEngine.prototype, "isChildPositionAllowed", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        StackPanelLayoutEngine._horizontal = null;
        StackPanelLayoutEngine._vertical = null;
        StackPanelLayoutEngine.dstOffset = BABYLON.Vector4.Zero();
        StackPanelLayoutEngine.dstArea = BABYLON.Size.Zero();
        StackPanelLayoutEngine = __decorate([
            BABYLON.className("StackPanelLayoutEngine", "BABYLON")
        ], StackPanelLayoutEngine);
        return StackPanelLayoutEngine;
    }(LayoutEngineBase));
    BABYLON.StackPanelLayoutEngine = StackPanelLayoutEngine;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    /**
     * Base class implementing the ILocable interface.
     * The particularity of this class is to call the protected onLock() method when the instance is about to be locked for good.
     */
    var LockableBase = (function () {
        function LockableBase() {
        }
        LockableBase.prototype.isLocked = function () {
            return this._isLocked;
        };
        LockableBase.prototype.lock = function () {
            if (this._isLocked) {
                return true;
            }
            this.onLock();
            this._isLocked = true;
            return false;
        };
        /**
         * Protected handler that will be called when the instance is about to be locked.
         */
        LockableBase.prototype.onLock = function () {
        };
        return LockableBase;
    }());
    BABYLON.LockableBase = LockableBase;
    var SolidColorBrush2D = (function (_super) {
        __extends(SolidColorBrush2D, _super);
        function SolidColorBrush2D(color, lock) {
            if (lock === void 0) { lock = false; }
            _super.call(this);
            this._color = color;
            if (lock) {
                {
                    this.lock();
                }
            }
        }
        /**
         * Return true if the brush is transparent, false if it's totally opaque
         */
        SolidColorBrush2D.prototype.isTransparent = function () {
            return this._color && this._color.a < 1.0;
        };
        Object.defineProperty(SolidColorBrush2D.prototype, "color", {
            /**
             * The color used by this instance to render
             * @returns the color object. Note that it's not a clone of the actual object stored in the instance so you MUST NOT modify it, otherwise unexpected behavior might occurs.
             */
            get: function () {
                return this._color;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._color = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Return a unique identifier of the instance, which is simply the hexadecimal representation (CSS Style) of the solid color.
         */
        SolidColorBrush2D.prototype.toString = function () {
            return this._color.toHexString();
        };
        SolidColorBrush2D = __decorate([
            BABYLON.className("SolidColorBrush2D", "BABYLON")
        ], SolidColorBrush2D);
        return SolidColorBrush2D;
    }(LockableBase));
    BABYLON.SolidColorBrush2D = SolidColorBrush2D;
    var GradientColorBrush2D = (function (_super) {
        __extends(GradientColorBrush2D, _super);
        function GradientColorBrush2D(color1, color2, translation, rotation, scale, lock) {
            if (translation === void 0) { translation = BABYLON.Vector2.Zero(); }
            if (rotation === void 0) { rotation = 0; }
            if (scale === void 0) { scale = 1; }
            if (lock === void 0) { lock = false; }
            _super.call(this);
            this._color1 = color1;
            this._color2 = color2;
            this._translation = translation;
            this._rotation = rotation;
            this._scale = scale;
            if (lock) {
                this.lock();
            }
        }
        /**
         * Return true if the brush is transparent, false if it's totally opaque
         */
        GradientColorBrush2D.prototype.isTransparent = function () {
            return (this._color1 && this._color1.a < 1.0) || (this._color2 && this._color2.a < 1.0);
        };
        Object.defineProperty(GradientColorBrush2D.prototype, "color1", {
            /**
             * First color, the blend will start from this color
             */
            get: function () {
                return this._color1;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._color1 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "color2", {
            /**
             * Second color, the blend will end to this color
             */
            get: function () {
                return this._color2;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._color2 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "translation", {
            /**
             * Translation vector to apply on the blend
             * Default is [0;0]
             */
            get: function () {
                return this._translation;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._translation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "rotation", {
            /**
             * Rotation in radian to apply to the brush
             * Default direction of the brush is vertical, you can change this using this property.
             * Default is 0.
             */
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._rotation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "scale", {
            /**
             * Scale factor to apply to the gradient.
             * Default is 1: no scale.
             */
            get: function () {
                return this._scale;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._scale = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Return a string describing the brush
         */
        GradientColorBrush2D.prototype.toString = function () {
            return "C1:" + this._color1 + ";C2:" + this._color2 + ";T:" + this._translation.toString() + ";R:" + this._rotation + ";S:" + this._scale + ";";
        };
        /**
         * Build a unique key string for the given parameters
         */
        GradientColorBrush2D.BuildKey = function (color1, color2, translation, rotation, scale) {
            return "C1:" + color1 + ";C2:" + color2 + ";T:" + translation.toString() + ";R:" + rotation + ";S:" + scale + ";";
        };
        GradientColorBrush2D = __decorate([
            BABYLON.className("GradientColorBrush2D", "BABYLON")
        ], GradientColorBrush2D);
        return GradientColorBrush2D;
    }(LockableBase));
    BABYLON.GradientColorBrush2D = GradientColorBrush2D;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Prim2DClassInfo = (function () {
        function Prim2DClassInfo() {
        }
        return Prim2DClassInfo;
    }());
    BABYLON.Prim2DClassInfo = Prim2DClassInfo;
    var Prim2DPropInfo = (function () {
        function Prim2DPropInfo() {
        }
        Prim2DPropInfo.PROPKIND_MODEL = 1;
        Prim2DPropInfo.PROPKIND_INSTANCE = 2;
        Prim2DPropInfo.PROPKIND_DYNAMIC = 3;
        return Prim2DPropInfo;
    }());
    BABYLON.Prim2DPropInfo = Prim2DPropInfo;
    var ClassTreeInfo = (function () {
        function ClassTreeInfo(baseClass, type, classContentFactory) {
            this._baseClass = baseClass;
            this._type = type;
            this._subClasses = new Array();
            this._levelContent = new BABYLON.StringDictionary();
            this._classContentFactory = classContentFactory;
        }
        Object.defineProperty(ClassTreeInfo.prototype, "classContent", {
            get: function () {
                if (!this._classContent) {
                    this._classContent = this._classContentFactory(this._baseClass ? this._baseClass.classContent : null);
                }
                return this._classContent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassTreeInfo.prototype, "type", {
            get: function () {
                return this._type;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassTreeInfo.prototype, "levelContent", {
            get: function () {
                return this._levelContent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassTreeInfo.prototype, "fullContent", {
            get: function () {
                if (!this._fullContent) {
                    var dic_1 = new BABYLON.StringDictionary();
                    var curLevel = this;
                    while (curLevel) {
                        curLevel.levelContent.forEach(function (k, v) { return dic_1.add(k, v); });
                        curLevel = curLevel._baseClass;
                    }
                    this._fullContent = dic_1;
                }
                return this._fullContent;
            },
            enumerable: true,
            configurable: true
        });
        ClassTreeInfo.prototype.getLevelOf = function (type) {
            // Are we already there?
            if (type === this._type) {
                return this;
            }
            var baseProto = Object.getPrototypeOf(type);
            var curProtoContent = this.getOrAddType(Object.getPrototypeOf(baseProto), baseProto);
            if (!curProtoContent) {
                this.getLevelOf(baseProto);
            }
            return this.getOrAddType(baseProto, type);
        };
        ClassTreeInfo.prototype.getOrAddType = function (baseType, type) {
            // Are we at the level corresponding to the baseType?
            // If so, get or add the level we're looking for
            if (baseType === this._type) {
                for (var _i = 0, _a = this._subClasses; _i < _a.length; _i++) {
                    var subType = _a[_i];
                    if (subType.type === type) {
                        return subType.node;
                    }
                }
                var node = new ClassTreeInfo(this, type, this._classContentFactory);
                var info = { type: type, node: node };
                this._subClasses.push(info);
                return info.node;
            }
            // Recurse down to keep looking for the node corresponding to the baseTypeName
            for (var _b = 0, _c = this._subClasses; _b < _c.length; _b++) {
                var subType = _c[_b];
                var info = subType.node.getOrAddType(baseType, type);
                if (info) {
                    return info;
                }
            }
            return null;
        };
        ClassTreeInfo.get = function (type) {
            var dic = type["__classTreeInfo"];
            if (!dic) {
                return null;
            }
            return dic.getLevelOf(type);
        };
        ClassTreeInfo.getOrRegister = function (type, classContentFactory) {
            var dic = type["__classTreeInfo"];
            if (!dic) {
                dic = new ClassTreeInfo(null, type, classContentFactory);
                type["__classTreeInfo"] = dic;
            }
            return dic;
        };
        return ClassTreeInfo;
    }());
    BABYLON.ClassTreeInfo = ClassTreeInfo;
    var DataBinding = (function () {
        function DataBinding() {
            this._converter = null;
            this._mode = DataBinding.MODE_DEFAULT;
            this._uiElementId = null;
            this._dataSource = null;
            this._currentDataSource = null;
            this._propertyPathName = null;
            this._stringFormat = null;
            this._updateSourceTrigger = DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED;
            this._boundTo = null;
            this._owner = null;
            this._updateCounter = 0;
        }
        Object.defineProperty(DataBinding.prototype, "converter", {
            /**
             * Provide a callback that will convert the value obtained by the Data Binding to the type of the SmartProperty it's bound to.
             * If no value are set, then it's assumed that the sourceValue is of the same type as the SmartProperty's one.
             * If the SmartProperty type is a basic data type (string, boolean or number) and no converter is specified but the sourceValue is of a different type, the conversion will be implicitly made, if possible.
             * @param sourceValue the source object retrieve by the Data Binding mechanism
             * @returns the object of a compatible type with the SmartProperty it's bound to
             */
            get: function () {
                return this._converter;
            },
            set: function (value) {
                if (this._converter === value) {
                    return;
                }
                this._converter = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "mode", {
            /**
             * Set the mode to use for the data flow in the binding. Set one of the MODE_xxx static member of this class. If not specified then MODE_DEFAULT will be used
             */
            get: function () {
                if (this._mode === DataBinding.MODE_DEFAULT) {
                    return this._boundTo.bindingMode;
                }
                return this._mode;
            },
            set: function (value) {
                if (this._mode === value) {
                    return;
                }
                this._mode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "uiElementId", {
            /**
             * You can override the Data Source object with this member which is the Id of a uiElement existing in the UI Logical tree.
             * If not set and source no set too, then the dataSource property will be used.
             */
            get: function () {
                return this._uiElementId;
            },
            set: function (value) {
                if (this._uiElementId === value) {
                    return;
                }
                this._uiElementId = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "dataSource", {
            /**
             * You can override the Data Source object with this member which is the source object to use directly.
             * If not set and uiElement no set too, then the dataSource property of the SmartPropertyBase object will be used.
             */
            get: function () {
                return this._dataSource;
            },
            set: function (value) {
                if (this._dataSource === value) {
                    return;
                }
                this._dataSource = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "propertyPathName", {
            /**
             * The path & name of the property to get from the source object.
             * Once the Source object is evaluated (it's either the one got from uiElementId, source or dataSource) you can specify which property of this object is the value to bind to the smartProperty.
             * If nothing is set then the source object will be used.
             * You can specify an indirect property using the format "firstProperty.indirectProperty" like "address.postalCode" if the source is a Customer object which contains an address property and the Address class contains a postalCode property.
             * If the property is an Array and you want to address a particular element then use the 'arrayProperty[index]' notation. For example "phoneNumbers[0]" to get the first element of the phoneNumber property which is an array.
             */
            get: function () {
                return this._propertyPathName;
            },
            set: function (value) {
                if (this._propertyPathName === value) {
                    return;
                }
                if (this._owner) {
                }
                this._propertyPathName = value;
                if (this._owner) {
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "stringFormat", {
            /**
             * If the Smart Property is of the string type, you can use the string interpolation notation to provide how the sourceValue will be formatted, reference to the source value must be made via the token: ${value}. For instance `Customer Name: ${value}`
             */
            get: function () {
                return this._stringFormat;
            },
            set: function (value) {
                if (this._stringFormat === value) {
                    return;
                }
                this._stringFormat = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "updateSourceTrigger", {
            /**
             * Specify how the source should be updated, use one of the UPDATESOURCETRIGGER_xxx member of this class, if not specified then UPDATESOURCETRIGGER_DEFAULT will be used.
             */
            get: function () {
                return this._updateSourceTrigger;
            },
            set: function (value) {
                if (this._updateSourceTrigger === value) {
                    return;
                }
                this._updateSourceTrigger = value;
            },
            enumerable: true,
            configurable: true
        });
        DataBinding.prototype.canUpdateTarget = function (resetUpdateCounter) {
            if (resetUpdateCounter) {
                this._updateCounter = 0;
            }
            var mode = this.mode;
            if (mode === DataBinding.MODE_ONETIME) {
                return this._updateCounter === 0;
            }
            if (mode === DataBinding.MODE_ONEWAYTOSOURCE) {
                return false;
            }
            return true;
        };
        DataBinding.prototype.updateTarget = function () {
            var value = this._getActualDataSource();
            var properties = this.propertyPathName.split(".");
            for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                var propertyName = properties_1[_i];
                value = value[propertyName];
            }
            this._storeBoundValue(this._owner, value);
        };
        DataBinding.prototype._storeBoundValue = function (watcher, value) {
            if ((++this._updateCounter > 1) && (this.mode === DataBinding.MODE_ONETIME)) {
                return;
            }
            var newValue = value;
            if (this._converter) {
                newValue = this._converter(value);
            }
            if (this._stringFormat) {
                newValue = this._stringFormat(newValue);
            }
            watcher[this._boundTo.name] = newValue;
        };
        DataBinding.prototype._getActualDataSource = function () {
            if (this.dataSource) {
                return this.dataSource;
            }
            if (this.uiElementId) {
                // TODO Find UIElement
                return null;
            }
            return this._owner.dataSource;
        };
        DataBinding.prototype._registerDataSource = function (updateTarget) {
            var ds = this._getActualDataSource();
            if (ds === this._currentDataSource) {
                return;
            }
            if (this._currentDataSource) {
                BindingHelper.unregisterDataSource(this._currentDataSource, this, 0);
            }
            if (ds) {
                BindingHelper.registerDataSource(ds, this);
                if (updateTarget && this.canUpdateTarget(true)) {
                    this.updateTarget();
                }
            }
            this._currentDataSource = ds;
        };
        DataBinding.prototype._unregisterDataSource = function () {
            var ds = this._getActualDataSource();
            if (ds) {
                BindingHelper.unregisterDataSource(ds, this, 0);
            }
        };
        /**
         * Use the mode specified in the SmartProperty declaration
         */
        DataBinding.MODE_DEFAULT = 1;
        /**
         * Update the binding target only once when the Smart Property's value is first accessed
         */
        DataBinding.MODE_ONETIME = 2;
        /**
         * Update the smart property when the source changes.
         * The source won't be updated if the smart property value is set.
         */
        DataBinding.MODE_ONEWAY = 3;
        /**
         * Only update the source when the target's data is changing.
         */
        DataBinding.MODE_ONEWAYTOSOURCE = 4;
        /**
         * Update the bind target when the source changes and update the source when the Smart Property value is set.
         */
        DataBinding.MODE_TWOWAY = 5;
        /**
         * Use the Update Source Trigger defined in the SmartProperty declaration
         */
        DataBinding.UPDATESOURCETRIGGER_DEFAULT = 1;
        /**
         * Update the source as soon as the Smart Property has a value change
         */
        DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED = 2;
        /**
         * Update the source when the binding target loses focus
         */
        DataBinding.UPDATESOURCETRIGGER_LOSTFOCUS = 3;
        /**
         * Update the source will be made by explicitly calling the UpdateFromDataSource method
         */
        DataBinding.UPDATESOURCETRIGGER_EXPLICIT = 4;
        DataBinding = __decorate([
            BABYLON.className("DataBinding", "BABYLON")
        ], DataBinding);
        return DataBinding;
    }());
    BABYLON.DataBinding = DataBinding;
    var SmartPropertyBase = (function (_super) {
        __extends(SmartPropertyBase, _super);
        function SmartPropertyBase() {
            _super.call(this);
            this._dataSource = null;
            this._dataSourceObserver = null;
            this._instanceDirtyFlags = 0;
            this._isDisposed = false;
            this._bindings = null;
            this._hasBinding = 0;
            this._bindingSourceChanged = 0;
            this._disposeObservable = null;
        }
        Object.defineProperty(SmartPropertyBase.prototype, "disposeObservable", {
            get: function () {
                if (!this._disposeObservable) {
                    this._disposeObservable = new BABYLON.Observable();
                }
                return this._disposeObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SmartPropertyBase.prototype, "isDisposed", {
            /**
             * Check if the object is disposed or not.
             * @returns true if the object is dispose, false otherwise.
             */
            get: function () {
                return this._isDisposed;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        SmartPropertyBase.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            if (this._disposeObservable && this._disposeObservable.hasObservers()) {
                this._disposeObservable.notifyObservers(this);
            }
            this._isDisposed = true;
            return true;
        };
        /**
         * Check if a given set of properties are dirty or not.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return true if at least one property is dirty, false if none of them are.
         */
        SmartPropertyBase.prototype.checkPropertiesDirty = function (flags) {
            return (this._instanceDirtyFlags & flags) !== 0;
        };
        /**
         * Clear a given set of properties.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return the new set of property still marked as dirty
         */
        SmartPropertyBase.prototype.clearPropertiesDirty = function (flags) {
            this._instanceDirtyFlags &= ~flags;
            return this._instanceDirtyFlags;
        };
        SmartPropertyBase.prototype._resetPropertiesDirty = function () {
            this._instanceDirtyFlags = 0;
        };
        /**
         * Add an externally attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        SmartPropertyBase.prototype.addExternalData = function (key, data) {
            if (!this._externalData) {
                this._externalData = new BABYLON.StringDictionary();
            }
            return this._externalData.add(key, data);
        };
        /**
         * Get an externally attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        SmartPropertyBase.prototype.getExternalData = function (key) {
            if (!this._externalData) {
                return null;
            }
            return this._externalData.get(key);
        };
        /**
         * Get an externally attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        SmartPropertyBase.prototype.getOrAddExternalDataWithFactory = function (key, factory) {
            if (!this._externalData) {
                this._externalData = new BABYLON.StringDictionary();
            }
            return this._externalData.getOrAddWithFactory(key, factory);
        };
        /**
         * Remove an externally attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        SmartPropertyBase.prototype.removeExternalData = function (key) {
            if (!this._externalData) {
                return false;
            }
            return this._externalData.remove(key);
        };
        SmartPropertyBase._hookProperty = function (propId, piStore, kind, settings) {
            return function (target, propName, descriptor) {
                if (!settings) {
                    settings = {};
                }
                var propInfo = SmartPropertyBase._createPropInfo(target, propName, propId, kind, settings);
                if (piStore) {
                    piStore(propInfo);
                }
                var getter = descriptor.get, setter = descriptor.set;
                var typeLevelCompare = (settings.typeLevelCompare !== undefined) ? settings.typeLevelCompare : false;
                // Overload the property setter implementation to add our own logic
                descriptor.set = function (val) {
                    if (!setter) {
                        throw Error("Property '" + propInfo.name + "' of type '" + BABYLON.Tools.getFullClassName(this) + "' has no setter defined but was invoked as if it had one.");
                    }
                    // check for disposed first, do nothing
                    if (this.isDisposed) {
                        return;
                    }
                    var curVal = getter.call(this);
                    if (SmartPropertyBase._checkUnchanged(curVal, val)) {
                        return;
                    }
                    // Cast the object we're working one
                    var prim = this;
                    // Change the value
                    setter.call(this, val);
                    // Notify change, dirty flags update
                    prim._handlePropChanged(curVal, val, propName, propInfo, typeLevelCompare);
                };
            };
        };
        SmartPropertyBase._createPropInfo = function (target, propName, propId, kind, settings) {
            var dic = ClassTreeInfo.getOrRegister(target, function () { return new Prim2DClassInfo(); });
            var node = dic.getLevelOf(target);
            var propInfo = node.levelContent.get(propId.toString());
            if (propInfo) {
                throw new Error("The ID " + propId + " is already taken by another property declaration named: " + propInfo.name);
            }
            // Create, setup and add the PropInfo object to our prop dictionary
            propInfo = new Prim2DPropInfo();
            propInfo.id = propId;
            propInfo.flagId = Math.pow(2, propId);
            propInfo.kind = kind;
            propInfo.name = propName;
            propInfo.bindingMode = (settings.bindingMode !== undefined) ? settings.bindingMode : DataBinding.MODE_TWOWAY;
            propInfo.bindingUpdateSourceTrigger = (settings.bindingUpdateSourceTrigger !== undefined) ? settings.bindingUpdateSourceTrigger : DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED;
            propInfo.dirtyBoundingInfo = (settings.dirtyBoundingInfo !== undefined) ? settings.dirtyBoundingInfo : false;
            propInfo.dirtyParentBoundingInfo = (settings.dirtyParentBoundingBox !== undefined) ? settings.dirtyParentBoundingBox : false;
            propInfo.typeLevelCompare = (settings.typeLevelCompare !== undefined) ? settings.typeLevelCompare : false;
            node.levelContent.add(propName, propInfo);
            return propInfo;
        };
        Object.defineProperty(SmartPropertyBase.prototype, "propDic", {
            /**
             * Access the dictionary of properties metadata. Only properties decorated with XXXXLevelProperty are concerned
             * @returns the dictionary, the key is the property name as declared in Javascript, the value is the metadata object
             */
            get: function () {
                if (!this._propInfo) {
                    var cti = ClassTreeInfo.get(Object.getPrototypeOf(this));
                    if (!cti) {
                        throw new Error("Can't access the propDic member in class definition, is this class SmartPropertyPrim based?");
                    }
                    this._propInfo = cti.fullContent;
                }
                return this._propInfo;
            },
            enumerable: true,
            configurable: true
        });
        SmartPropertyBase._checkUnchanged = function (curValue, newValue) {
            // Nothing to nothing: nothing to do!
            if ((curValue === null && newValue === null) || (curValue === undefined && newValue === undefined)) {
                return true;
            }
            // Check value unchanged
            if ((curValue != null) && (newValue != null)) {
                if (typeof (curValue.equals) == "function") {
                    if (curValue.equals(newValue)) {
                        return true;
                    }
                }
                else {
                    if (curValue === newValue) {
                        return true;
                    }
                }
            }
            return false;
        };
        SmartPropertyBase.prototype._handlePropChanged = function (curValue, newValue, propName, propInfo, typeLevelCompare) {
            // Trigger property changed
            var info = SmartPropertyBase.propChangeGuarding ? new BABYLON.PropertyChangedInfo() : SmartPropertyPrim.propChangedInfo;
            info.oldValue = curValue;
            info.newValue = newValue;
            info.propertyName = propName;
            var propMask = propInfo ? propInfo.flagId : -1;
            try {
                SmartPropertyBase.propChangeGuarding = true;
                this.propertyChanged.notifyObservers(info, propMask);
            }
            finally {
                SmartPropertyBase.propChangeGuarding = false;
            }
        };
        SmartPropertyBase.prototype._triggerPropertyChanged = function (propInfo, newValue) {
            if (this.isDisposed) {
                return;
            }
            if (!propInfo) {
                return;
            }
            this._handlePropChanged(undefined, newValue, propInfo.name, propInfo, propInfo.typeLevelCompare);
        };
        Object.defineProperty(SmartPropertyBase.prototype, "dataSource", {
            /**
             * Set the object from which Smart Properties using Binding will take/update their data from/to.
             * When the object is part of a graph (with parent/children relationship) if the dataSource of a given instance is not specified, then the parent's one is used.
             */
            get: function () {
                // Don't access to _dataSource directly but via a call to the _getDataSource method which can be overloaded in inherited classes
                return this._getDataSource();
            },
            set: function (value) {
                if (this._dataSource === value) {
                    return;
                }
                var oldValue = this._dataSource;
                this._dataSource = value;
                if (this._bindings && value != null) {
                    // Register the bindings
                    for (var _i = 0, _a = this._bindings; _i < _a.length; _i++) {
                        var binding = _a[_i];
                        if (binding != null) {
                            binding._registerDataSource(true);
                        }
                    }
                }
                this.onPropertyChanged("dataSource", oldValue, value);
            },
            enumerable: true,
            configurable: true
        });
        // Inheriting classes can overload this method to provides additional logic for dataSource access
        SmartPropertyBase.prototype._getDataSource = function () {
            return this._dataSource;
        };
        SmartPropertyBase.prototype.createSimpleDataBinding = function (propInfo, propertyPathName, mode) {
            if (mode === void 0) { mode = DataBinding.MODE_DEFAULT; }
            var binding = new DataBinding();
            binding.propertyPathName = propertyPathName;
            binding.mode = mode;
            return this.createDataBinding(propInfo, binding);
        };
        SmartPropertyBase.prototype.createDataBinding = function (propInfo, binding) {
            if (!this._bindings) {
                this._bindings = new Array();
            }
            if (!binding || binding._owner != null) {
                throw Error("A valid/unused Binding must be passed.");
            }
            // Unregister a potentially existing binding for this property
            this.removeDataBinding(propInfo);
            // register the binding
            binding._owner = this;
            binding._boundTo = propInfo;
            this._bindings[propInfo.id] = binding;
            this._hasBinding |= propInfo.flagId;
            binding._registerDataSource(true);
            return binding;
        };
        SmartPropertyBase.prototype.removeDataBinding = function (propInfo) {
            if ((this._hasBinding & propInfo.flagId) === 0) {
                return false;
            }
            var curBinding = this._bindings[propInfo.id];
            curBinding._unregisterDataSource();
            this._bindings[propInfo.id] = null;
            this._hasBinding &= ~propInfo.flagId;
            return true;
        };
        SmartPropertyBase.prototype.updateFromDataSource = function () {
            for (var _i = 0, _a = this._bindings; _i < _a.length; _i++) {
                var binding = _a[_i];
                if (binding) {
                }
            }
        };
        SmartPropertyBase.propChangedInfo = new BABYLON.PropertyChangedInfo();
        SmartPropertyBase.propChangeGuarding = false;
        SmartPropertyBase = __decorate([
            BABYLON.className("SmartPropertyBase", "BABYLON")
        ], SmartPropertyBase);
        return SmartPropertyBase;
    }(BABYLON.PropertyChangedBase));
    BABYLON.SmartPropertyBase = SmartPropertyBase;
    var BindingInfo = (function () {
        function BindingInfo(binding, level, isLast) {
            this.binding = binding;
            this.level = level;
            this.isLast = isLast;
        }
        return BindingInfo;
    }());
    var MonitoredObjectData = (function () {
        function MonitoredObjectData(monitoredObject) {
            var _this = this;
            this.monitoredObject = monitoredObject;
            this.monitoredIntermediateProperties = new BABYLON.StringDictionary();
            this.observer = this.monitoredObject.propertyChanged.add(function (e, s) { _this.propertyChangedHandler(e.propertyName, e.oldValue, e.newValue); });
            this.boundProperties = new BABYLON.StringDictionary();
            this.monitoredIntermediateMask = 0;
            this.boundPropertiesMask = 0;
        }
        MonitoredObjectData.prototype.propertyChangedHandler = function (propName, oldValue, newValue) {
            var propId = BindingHelper._getPropertyID(this.monitoredObject, propName);
            var propIdStr = propId.toString();
            // Loop through all the registered bindings for this property that had a value change
            if ((this.boundPropertiesMask & propId) !== 0) {
                var bindingInfos = this.boundProperties.get(propIdStr);
                for (var _i = 0, bindingInfos_1 = bindingInfos; _i < bindingInfos_1.length; _i++) {
                    var bi = bindingInfos_1[_i];
                    if (!bi.isLast) {
                        BindingHelper.unregisterDataSource(this.monitoredObject, bi.binding, bi.level);
                        BindingHelper.registerDataSource(bi.binding._currentDataSource, bi.binding);
                    }
                    if (bi.binding.canUpdateTarget(false)) {
                        bi.binding.updateTarget();
                    }
                }
            }
        };
        return MonitoredObjectData;
    }());
    var BindingHelper = (function () {
        function BindingHelper() {
        }
        BindingHelper.registerDataSource = function (dataSource, binding) {
            var properties = binding.propertyPathName.split(".");
            var ownerMod = null;
            var ownerInterPropId = 0;
            var propertyOwner = dataSource;
            var _loop_1 = function(i) {
                var propName = properties[i];
                var propId = BindingHelper._getPropertyID(propertyOwner, propName);
                var propIdStr = propId.toString();
                var mod = void 0;
                if (ownerMod) {
                    var o_1 = ownerMod;
                    var po_1 = propertyOwner;
                    var oii_1 = ownerInterPropId;
                    mod = ownerMod.monitoredIntermediateProperties.getOrAddWithFactory(oii_1.toString(), function (k) {
                        o_1.monitoredIntermediateMask |= oii_1;
                        return BindingHelper._getMonitoredObjectData(po_1);
                    });
                }
                else {
                    mod = BindingHelper._getMonitoredObjectData(propertyOwner);
                }
                var m = mod;
                var bindingInfos = mod.boundProperties.getOrAddWithFactory(propIdStr, function (k) {
                    m.boundPropertiesMask |= propId;
                    return new Array();
                });
                var bi = BABYLON.Tools.first(bindingInfos, function (cbi) { return cbi.binding === binding; });
                if (!bi) {
                    bindingInfos.push(new BindingInfo(binding, i, (i + 1) === properties.length));
                }
                ownerMod = mod;
                ownerInterPropId = propId;
                propertyOwner = propertyOwner[propName];
            };
            for (var i = 0; i < properties.length; i++) {
                _loop_1(i);
            }
        };
        BindingHelper.unregisterDataSource = function (dataSource, binding, level) {
            var properties = binding.propertyPathName.split(".");
            var propertyOwner = dataSource;
            var mod = BindingHelper._getMonitoredObjectData(propertyOwner);
            for (var i = 0; i < properties.length; i++) {
                var propName = properties[i];
                var propId = BindingHelper._getPropertyID(propertyOwner, propName);
                var propIdStr = propId.toString();
                if (i >= level) {
                    mod = BindingHelper._unregisterBinding(mod, propId, binding);
                }
                else {
                    mod = mod.monitoredIntermediateProperties.get(propIdStr);
                }
                propertyOwner = propertyOwner[propName];
            }
        };
        BindingHelper._unregisterBinding = function (mod, propertyID, binding) {
            var propertyIDStr = propertyID.toString();
            var res = null;
            // Check if the property is registered as an intermediate and remove it
            if ((mod.monitoredIntermediateMask & propertyID) !== 0) {
                res = mod.monitoredIntermediateProperties.get(propertyIDStr);
                mod.monitoredIntermediateProperties.remove(propertyIDStr);
                // Update the mask
                mod.monitoredIntermediateMask &= ~propertyID;
            }
            // Check if the property is registered as a final property and remove it
            if ((mod.boundPropertiesMask & propertyID) !== 0) {
                var bindingInfos = mod.boundProperties.get(propertyIDStr);
                // Find the binding and remove it
                var bi = BABYLON.Tools.first(bindingInfos, function (cbi) { return cbi.binding === binding; });
                if (bi) {
                    var bii = bindingInfos.indexOf(bi);
                    bindingInfos.splice(bii, 1);
                }
                // If the array is empty, update the mask
                if (bindingInfos.length === 0) {
                    mod.boundPropertiesMask &= ~propertyID;
                }
            }
            // Check if the MOD is empty and unregister the observer and remove it from the list of MODs
            if (mod.boundPropertiesMask === 0 && mod.monitoredIntermediateMask === 0) {
                // Unregister the observer on Property Change
                mod.monitoredObject.propertyChanged.remove(mod.observer);
                // Remove the MOD from the dic
                var objectId = BindingHelper._getObjectId(mod.monitoredObject);
                BindingHelper._monitoredObjects.remove(objectId);
            }
            return res;
        };
        BindingHelper._getMonitoredObjectData = function (object) {
            var objectId = BindingHelper._getObjectId(object);
            var mod = BindingHelper._monitoredObjects.getOrAddWithFactory(objectId, function (k) { return new MonitoredObjectData(object); });
            return mod;
        };
        BindingHelper._getObjectId = function (obj) {
            var id = obj["__bindingHelperObjectId__"];
            if (id == null) {
                id = BABYLON.Tools.RandomId();
                obj["__bindingHelperObjectId__"] = id;
                return id;
            }
            return id;
        };
        BindingHelper._getObjectTypePropertyIDs = function (obj) {
            var fullName = BABYLON.Tools.getFullClassName(obj);
            if (!fullName) {
                throw Error("Types involved in Data Binding must be decorated with the @className decorator");
            }
            var d = BindingHelper._propertiesID.getOrAddWithFactory(fullName, function () { return new BABYLON.StringDictionary(); });
            return d;
        };
        BindingHelper._getPropertyID = function (object, propName) {
            var otd = BindingHelper._getObjectTypePropertyIDs(object);
            // Make sure we have a WatchedPropertyData for this property of this object type. This will contains the flagIg of the watched property.
            // We use this flagId to flag for each watched instance which properties are watched, as final or intermediate and which directions are used
            var propData = otd.getOrAddWithFactory(propName, function (k) { return 1 << otd.count; });
            return propData;
        };
        BindingHelper._propertiesID = new BABYLON.StringDictionary();
        BindingHelper._monitoredObjects = new BABYLON.StringDictionary();
        return BindingHelper;
    }());
    var SmartPropertyPrim = (function (_super) {
        __extends(SmartPropertyPrim, _super);
        function SmartPropertyPrim() {
            _super.call(this);
            this._flags = 0;
            this._modelKey = null;
            this._levelBoundingInfo = new BABYLON.BoundingInfo2D();
            this._boundingInfo = new BABYLON.BoundingInfo2D();
            this.animations = new Array();
        }
        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        SmartPropertyPrim.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            _super.prototype.dispose.call(this);
            // Don't set to null, it may upset somebody...
            this.animations.splice(0);
            return true;
        };
        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        SmartPropertyPrim.prototype.getAnimatables = function () {
            return new Array();
        };
        Object.defineProperty(SmartPropertyPrim.prototype, "modelKey", {
            /**
             * Property giving the Model Key associated to the property.
             * This value is constructed from the type of the primitive and all the name/value of its properties declared with the modelLevelProperty decorator
             * @returns the model key string.
             */
            get: function () {
                var _this = this;
                // No need to compute it?
                if (!this._isFlagSet(SmartPropertyPrim.flagModelDirty) && this._modelKey) {
                    return this._modelKey;
                }
                var modelKey = "Class:" + BABYLON.Tools.getClassName(this) + ";";
                var propDic = this.propDic;
                propDic.forEach(function (k, v) {
                    if (v.kind === Prim2DPropInfo.PROPKIND_MODEL) {
                        var propVal = _this[v.name];
                        // Special case, array, this WON'T WORK IN ALL CASES, all entries have to be of the same type and it must be a BJS well known one
                        if (propVal && propVal.constructor === Array) {
                            var firstVal = propVal[0];
                            if (!firstVal) {
                                propVal = 0;
                            }
                            else {
                                propVal = BABYLON.Tools.hashCodeFromStream(BABYLON.Tools.arrayOrStringFeeder(propVal));
                            }
                        }
                        modelKey += v.name + ":" + ((propVal != null) ? ((v.typeLevelCompare) ? BABYLON.Tools.getClassName(propVal) : propVal.toString()) : "[null]") + ";";
                    }
                });
                this._clearFlags(SmartPropertyPrim.flagModelDirty);
                this._modelKey = modelKey;
                return modelKey;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SmartPropertyPrim.prototype, "isDirty", {
            /**
             * States if the Primitive is dirty and should be rendered again next time.
             * @returns true is dirty, false otherwise
             */
            get: function () {
                return (this._instanceDirtyFlags !== 0) || this._areSomeFlagsSet(SmartPropertyPrim.flagModelDirty | SmartPropertyPrim.flagPositioningDirty | SmartPropertyPrim.flagLayoutDirty);
            },
            enumerable: true,
            configurable: true
        });
        SmartPropertyPrim.prototype._boundingBoxDirty = function () {
            this._setFlags(SmartPropertyPrim.flagLevelBoundingInfoDirty);
            // Escalate the dirty flag in the instance hierarchy, stop when a renderable group is found or at the end
            if (this instanceof BABYLON.Prim2DBase) {
                var curprim = this;
                while (curprim) {
                    curprim._setFlags(SmartPropertyPrim.flagBoundingInfoDirty);
                    if (curprim.isSizeAuto) {
                        curprim.onPrimitivePropertyDirty(BABYLON.Prim2DBase.sizeProperty.flagId);
                        curprim._setFlags(SmartPropertyPrim.flagPositioningDirty);
                    }
                    if (curprim instanceof BABYLON.Group2D) {
                        if (curprim.isRenderableGroup) {
                            break;
                        }
                    }
                    curprim = curprim.parent;
                }
            }
        };
        SmartPropertyPrim.prototype._handlePropChanged = function (curValue, newValue, propName, propInfo, typeLevelCompare) {
            _super.prototype._handlePropChanged.call(this, curValue, newValue, propName, propInfo, typeLevelCompare);
            // If the property change also dirty the boundingInfo, update the boundingInfo dirty flags
            if (propInfo.dirtyBoundingInfo) {
                this._boundingBoxDirty();
            }
            else if (propInfo.dirtyParentBoundingInfo) {
                var p = this._parent;
                if (p != null) {
                    p._boundingBoxDirty();
                }
            }
            // If the property belong to a group, check if it's a cached one, and dirty its render sprite accordingly
            if (this instanceof BABYLON.Group2D) {
                this.handleGroupChanged(propInfo);
            }
            // Check for parent layout dirty
            if (this instanceof BABYLON.Prim2DBase) {
                var p = this._parent;
                if (p != null && p.layoutEngine && (p.layoutEngine.layoutDirtyOnPropertyChangedMask & propInfo.flagId) !== 0) {
                    p._setLayoutDirty();
                }
            }
            // For type level compare, if there's a change of type it's a change of model, otherwise we issue an instance change
            var instanceDirty = false;
            if (typeLevelCompare && curValue != null && newValue != null) {
                var cvProto = curValue.__proto__;
                var nvProto = newValue.__proto__;
                instanceDirty = (cvProto === nvProto);
            }
            // Set the dirty flags
            if (!instanceDirty && (propInfo.kind === Prim2DPropInfo.PROPKIND_MODEL)) {
                if (!this.isDirty) {
                    this._setFlags(SmartPropertyPrim.flagModelDirty);
                }
            }
            else if (instanceDirty || (propInfo.kind === Prim2DPropInfo.PROPKIND_INSTANCE) || (propInfo.kind === Prim2DPropInfo.PROPKIND_DYNAMIC)) {
                var propMask = propInfo.flagId;
                this.onPrimitivePropertyDirty(propMask);
            }
        };
        SmartPropertyPrim.prototype.onPrimitivePropertyDirty = function (propFlagId) {
            this.onPrimBecomesDirty();
            this._instanceDirtyFlags |= propFlagId;
        };
        SmartPropertyPrim.prototype.handleGroupChanged = function (prop) {
        };
        SmartPropertyPrim.prototype._resetPropertiesDirty = function () {
            _super.prototype._resetPropertiesDirty.call(this);
            this._clearFlags(SmartPropertyPrim.flagPrimInDirtyList | SmartPropertyPrim.flagNeedRefresh);
        };
        Object.defineProperty(SmartPropertyPrim.prototype, "levelBoundingInfo", {
            /**
             * Retrieve the boundingInfo for this Primitive, computed based on the primitive itself and NOT its children
             */
            get: function () {
                if (this._isFlagSet(SmartPropertyPrim.flagLevelBoundingInfoDirty)) {
                    this.updateLevelBoundingInfo();
                    this._clearFlags(SmartPropertyPrim.flagLevelBoundingInfoDirty);
                }
                return this._levelBoundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * This method must be overridden by a given Primitive implementation to compute its boundingInfo
         */
        SmartPropertyPrim.prototype.updateLevelBoundingInfo = function () {
        };
        /**
         * Property method called when the Primitive becomes dirty
         */
        SmartPropertyPrim.prototype.onPrimBecomesDirty = function () {
        };
        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        SmartPropertyPrim.prototype._isFlagSet = function (flag) {
            return (this._flags & flag) !== 0;
        };
        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        SmartPropertyPrim.prototype._areAllFlagsSet = function (flags) {
            return (this._flags & flags) === flags;
        };
        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        SmartPropertyPrim.prototype._areSomeFlagsSet = function (flags) {
            return (this._flags & flags) !== 0;
        };
        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        SmartPropertyPrim.prototype._clearFlags = function (flags) {
            this._flags &= ~flags;
        };
        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        SmartPropertyPrim.prototype._setFlags = function (flags) {
            var cur = this._flags;
            this._flags |= flags;
            return cur;
        };
        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        SmartPropertyPrim.prototype._changeFlags = function (flags, state) {
            if (state) {
                this._flags |= flags;
            }
            else {
                this._flags &= ~flags;
            }
        };
        SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT = 0;
        SmartPropertyPrim.flagNoPartOfLayout = 0x0000001; // set if the primitive's position/size must not be computed by Layout Engine
        SmartPropertyPrim.flagLevelBoundingInfoDirty = 0x0000002; // set if the primitive's level bounding box (not including children) is dirty
        SmartPropertyPrim.flagModelDirty = 0x0000004; // set if the model must be changed
        SmartPropertyPrim.flagLayoutDirty = 0x0000008; // set if the layout must be computed
        SmartPropertyPrim.flagLevelVisible = 0x0000010; // set if the primitive is set as visible for its level only
        SmartPropertyPrim.flagBoundingInfoDirty = 0x0000020; // set if the primitive's overall bounding box (including children) is dirty
        SmartPropertyPrim.flagIsPickable = 0x0000040; // set if the primitive can be picked during interaction
        SmartPropertyPrim.flagIsVisible = 0x0000080; // set if the primitive is concretely visible (use the levelVisible of parents)
        SmartPropertyPrim.flagVisibilityChanged = 0x0000100; // set if there was a transition between visible/hidden status
        SmartPropertyPrim.flagPositioningDirty = 0x0000200; // set if the primitive positioning must be computed
        SmartPropertyPrim.flagTrackedGroup = 0x0000400; // set if the group2D is tracking a scene node
        SmartPropertyPrim.flagWorldCacheChanged = 0x0000800; // set if the cached bitmap of a world space canvas changed
        SmartPropertyPrim.flagChildrenFlatZOrder = 0x0001000; // set if all the children (direct and indirect) will share the same Z-Order
        SmartPropertyPrim.flagZOrderDirty = 0x0002000; // set if the Z-Order for this prim and its children must be recomputed
        SmartPropertyPrim.flagActualOpacityDirty = 0x0004000; // set if the actualOpactity should be recomputed
        SmartPropertyPrim.flagPrimInDirtyList = 0x0008000; // set if the primitive is in the primDirtyList
        SmartPropertyPrim.flagIsContainer = 0x0010000; // set if the primitive is a container
        SmartPropertyPrim.flagNeedRefresh = 0x0020000; // set if the primitive wasn't successful at refresh
        SmartPropertyPrim.flagActualScaleDirty = 0x0040000; // set if the actualScale property needs to be recomputed
        SmartPropertyPrim.flagDontInheritParentScale = 0x0080000; // set if the actualScale must not use its parent's scale to be computed
        SmartPropertyPrim.flagGlobalTransformDirty = 0x0100000; // set if the global transform must be recomputed due to a local transform change
        SmartPropertyPrim.flagLayoutBoundingInfoDirty = 0x0100000; // set if the layout bounding info is dirty
        SmartPropertyPrim = __decorate([
            BABYLON.className("SmartPropertyPrim", "BABYLON")
        ], SmartPropertyPrim);
        return SmartPropertyPrim;
    }(SmartPropertyBase));
    BABYLON.SmartPropertyPrim = SmartPropertyPrim;
    function dependencyProperty(propId, piStore, mode, updateSourceTrigger) {
        if (mode === void 0) { mode = DataBinding.MODE_TWOWAY; }
        if (updateSourceTrigger === void 0) { updateSourceTrigger = DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_DYNAMIC, { bindingMode: mode, bindingUpdateSourceTrigger: updateSourceTrigger });
    }
    BABYLON.dependencyProperty = dependencyProperty;
    function modelLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_MODEL, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
    BABYLON.modelLevelProperty = modelLevelProperty;
    function instanceLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_INSTANCE, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
    BABYLON.instanceLevelProperty = instanceLevelProperty;
    function dynamicLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_DYNAMIC, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
    BABYLON.dynamicLevelProperty = dynamicLevelProperty;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var PrepareRender2DContext = (function () {
        function PrepareRender2DContext() {
            this.forceRefreshPrimitive = false;
        }
        return PrepareRender2DContext;
    }());
    BABYLON.PrepareRender2DContext = PrepareRender2DContext;
    var Render2DContext = (function () {
        function Render2DContext(renderMode) {
            this._renderMode = renderMode;
            this.useInstancing = false;
            this.groupInfoPartData = null;
            this.partDataStartIndex = this.partDataEndIndex = null;
            this.instancedBuffers = null;
        }
        Object.defineProperty(Render2DContext.prototype, "renderMode", {
            /**
             * Define which render Mode should be used to render the primitive: one of Render2DContext.RenderModeXxxx property
             */
            get: function () {
                return this._renderMode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render2DContext, "RenderModeOpaque", {
            /**
             * The set of primitives to render is opaque.
             * This is the first rendering pass. All Opaque primitives are rendered. Depth Compare and Write are both enabled.
             */
            get: function () {
                return Render2DContext._renderModeOpaque;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render2DContext, "RenderModeAlphaTest", {
            /**
             * The set of primitives to render is using Alpha Test (aka masking).
             * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeOpaque and is depth independent (i.e. primitives are not sorted by depth). Depth Compare and Write are both enabled.
             */
            get: function () {
                return Render2DContext._renderModeAlphaTest;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render2DContext, "RenderModeTransparent", {
            /**
             * The set of primitives to render is transparent.
             * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeAlphaTest and is depth dependent (i.e. primitives are stored by depth and rendered back to front). Depth Compare is on, but Depth write is Off.
             */
            get: function () {
                return Render2DContext._renderModeTransparent;
            },
            enumerable: true,
            configurable: true
        });
        Render2DContext._renderModeOpaque = 1;
        Render2DContext._renderModeAlphaTest = 2;
        Render2DContext._renderModeTransparent = 3;
        return Render2DContext;
    }());
    BABYLON.Render2DContext = Render2DContext;
    /**
     * This class store information for the pointerEventObservable Observable.
     * The Observable is divided into many sub events (using the Mask feature of the Observable pattern): PointerOver, PointerEnter, PointerDown, PointerMouseWheel, PointerMove, PointerUp, PointerDown, PointerLeave, PointerGotCapture and PointerLostCapture.
     */
    var PrimitivePointerInfo = (function () {
        function PrimitivePointerInfo() {
            this.primitivePointerPos = BABYLON.Vector2.Zero();
            this.tilt = BABYLON.Vector2.Zero();
            this.cancelBubble = false;
        }
        Object.defineProperty(PrimitivePointerInfo, "PointerOver", {
            // The behavior is based on the HTML specifications of the Pointer Events (https://www.w3.org/TR/pointerevents/#list-of-pointer-events). This is not 100% compliant and not meant to be, but still, it's based on these specs for most use cases to be programmed the same way (as closest as possible) as it would have been in HTML.
            /**
             * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerOver;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerEnter", {
            /**
             * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive or one of its descendants.
             * Bubbles: no
             */
            get: function () {
                return PrimitivePointerInfo._pointerEnter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerDown", {
            /**
             * This event type is raised when a pointer enters the active button state (non-zero value in the buttons property). For mouse it's when the device transitions from no buttons depressed to at least one button depressed. For touch/pen this is when a physical contact is made.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerDown;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerMouseWheel", {
            /**
             * This event type is raised when the pointer is a mouse and it's wheel is rolling
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerMouseWheel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerMove", {
            /**
             * This event type is raised when a pointer change coordinates or when a pointer changes button state, pressure, tilt, or contact geometry and the circumstances produce no other pointers events.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerMove;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerUp", {
            /**
             * This event type is raised when the pointer leaves the active buttons states (zero value in the buttons property). For mouse, this is when the device transitions from at least one button depressed to no buttons depressed. For touch/pen, this is when physical contact is removed.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerUp;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerOut", {
            /**
             * This event type is raised when a pointing device is moved out of the hit test the boundaries of a primitive.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerOut;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerLeave", {
            /**
             * This event type is raised when a pointing device is moved out of the hit test boundaries of a primitive and all its descendants.
             * Bubbles: no
             */
            get: function () {
                return PrimitivePointerInfo._pointerLeave;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerGotCapture", {
            /**
             * This event type is raised when a primitive receives the pointer capture. This event is fired at the element that is receiving pointer capture. Subsequent events for that pointer will be fired at this element.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerGotCapture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerLostCapture", {
            /**
             * This event type is raised after pointer capture is released for a pointer.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerLostCapture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "MouseWheelPrecision", {
            get: function () {
                return PrimitivePointerInfo._mouseWheelPrecision;
            },
            enumerable: true,
            configurable: true
        });
        PrimitivePointerInfo.prototype.updateRelatedTarget = function (prim, primPointerPos) {
            this.relatedTarget = prim;
            this.relatedTargetPointerPos = primPointerPos;
        };
        PrimitivePointerInfo.getEventTypeName = function (mask) {
            switch (mask) {
                case PrimitivePointerInfo.PointerOver: return "PointerOver";
                case PrimitivePointerInfo.PointerEnter: return "PointerEnter";
                case PrimitivePointerInfo.PointerDown: return "PointerDown";
                case PrimitivePointerInfo.PointerMouseWheel: return "PointerMouseWheel";
                case PrimitivePointerInfo.PointerMove: return "PointerMove";
                case PrimitivePointerInfo.PointerUp: return "PointerUp";
                case PrimitivePointerInfo.PointerOut: return "PointerOut";
                case PrimitivePointerInfo.PointerLeave: return "PointerLeave";
                case PrimitivePointerInfo.PointerGotCapture: return "PointerGotCapture";
                case PrimitivePointerInfo.PointerLostCapture: return "PointerLostCapture";
            }
        };
        PrimitivePointerInfo._pointerOver = 0x0001;
        PrimitivePointerInfo._pointerEnter = 0x0002;
        PrimitivePointerInfo._pointerDown = 0x0004;
        PrimitivePointerInfo._pointerMouseWheel = 0x0008;
        PrimitivePointerInfo._pointerMove = 0x0010;
        PrimitivePointerInfo._pointerUp = 0x0020;
        PrimitivePointerInfo._pointerOut = 0x0040;
        PrimitivePointerInfo._pointerLeave = 0x0080;
        PrimitivePointerInfo._pointerGotCapture = 0x0100;
        PrimitivePointerInfo._pointerLostCapture = 0x0200;
        PrimitivePointerInfo._mouseWheelPrecision = 3.0;
        return PrimitivePointerInfo;
    }());
    BABYLON.PrimitivePointerInfo = PrimitivePointerInfo;
    /**
     * Defines the horizontal and vertical alignment information for a Primitive.
     */
    var PrimitiveAlignment = (function () {
        function PrimitiveAlignment(changeCallback) {
            this._changedCallback = changeCallback;
            this._horizontal = PrimitiveAlignment.AlignLeft;
            this._vertical = PrimitiveAlignment.AlignBottom;
        }
        Object.defineProperty(PrimitiveAlignment, "AlignLeft", {
            /**
             * Alignment is made relative to the left edge of the Primitive. Valid for horizontal alignment only.
             */
            get: function () { return PrimitiveAlignment._AlignLeft; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignTop", {
            /**
             * Alignment is made relative to the top edge of the Primitive. Valid for vertical alignment only.
             */
            get: function () { return PrimitiveAlignment._AlignTop; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignRight", {
            /**
             * Alignment is made relative to the right edge of the Primitive. Valid for horizontal alignment only.
             */
            get: function () { return PrimitiveAlignment._AlignRight; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignBottom", {
            /**
             * Alignment is made relative to the bottom edge of the Primitive. Valid for vertical alignment only.
             */
            get: function () { return PrimitiveAlignment._AlignBottom; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignCenter", {
            /**
             * Alignment is made to center the content from equal distance to the opposite edges of the Primitive
             */
            get: function () { return PrimitiveAlignment._AlignCenter; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignStretch", {
            /**
             * The content is stretched toward the opposite edges of the Primitive
             */
            get: function () { return PrimitiveAlignment._AlignStretch; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment.prototype, "horizontal", {
            /**
             * Get/set the horizontal alignment. Use one of the AlignXXX static properties of this class
             */
            get: function () {
                return this._horizontal;
            },
            set: function (value) {
                if (this._horizontal === value) {
                    return;
                }
                this._horizontal = value;
                this.onChangeCallback();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment.prototype, "vertical", {
            /**
             * Get/set the vertical alignment. Use one of the AlignXXX static properties of this class
             */
            get: function () {
                return this._vertical;
            },
            set: function (value) {
                if (this._vertical === value) {
                    return;
                }
                this._vertical = value;
                this.onChangeCallback();
            },
            enumerable: true,
            configurable: true
        });
        PrimitiveAlignment.prototype.onChangeCallback = function () {
            if (this._changedCallback) {
                this._changedCallback();
            }
        };
        /**
         * Set the horizontal alignment from a string value.
         * @param text can be either: 'left','right','center','stretch'
         */
        PrimitiveAlignment.prototype.setHorizontal = function (text) {
            var v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "left":
                    this.horizontal = PrimitiveAlignment.AlignLeft;
                    return;
                case "right":
                    this.horizontal = PrimitiveAlignment.AlignRight;
                    return;
                case "center":
                    this.horizontal = PrimitiveAlignment.AlignCenter;
                    return;
                case "stretch":
                    this.horizontal = PrimitiveAlignment.AlignStretch;
                    return;
            }
        };
        /**
         * Set the vertical alignment from a string value.
         * @param text can be either: 'top','bottom','center','stretch'
         */
        PrimitiveAlignment.prototype.setVertical = function (text) {
            var v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "top":
                    this.vertical = PrimitiveAlignment.AlignTop;
                    return;
                case "bottom":
                    this.vertical = PrimitiveAlignment.AlignBottom;
                    return;
                case "center":
                    this.vertical = PrimitiveAlignment.AlignCenter;
                    return;
                case "stretch":
                    this.vertical = PrimitiveAlignment.AlignStretch;
                    return;
            }
        };
        /**
         * Set the horizontal and or vertical alignments from a string value.
         * @param text can be: [<h:|horizontal:><left|right|center|stretch>], [<v:|vertical:><top|bottom|center|stretch>]
         */
        PrimitiveAlignment.prototype.fromString = function (value) {
            var m = value.trim().split(",");
            if (m.length === 1) {
                this.setHorizontal(m[0]);
                this.setVertical(m[0]);
            }
            else {
                for (var _i = 0, m_1 = m; _i < m_1.length; _i++) {
                    var v = m_1[_i];
                    v = v.toLocaleLowerCase().trim();
                    // Horizontal
                    var i = v.indexOf("h:");
                    if (i === -1) {
                        i = v.indexOf("horizontal:");
                    }
                    if (i !== -1) {
                        v = v.substr(v.indexOf(":") + 1);
                        this.setHorizontal(v);
                        continue;
                    }
                    // Vertical
                    i = v.indexOf("v:");
                    if (i === -1) {
                        i = v.indexOf("vertical:");
                    }
                    if (i !== -1) {
                        v = v.substr(v.indexOf(":") + 1);
                        this.setVertical(v);
                        continue;
                    }
                }
            }
        };
        PrimitiveAlignment.prototype.copyFrom = function (pa) {
            this._horizontal = pa._horizontal;
            this._vertical = pa._vertical;
            this.onChangeCallback();
        };
        Object.defineProperty(PrimitiveAlignment.prototype, "isDefault", {
            get: function () {
                return this.horizontal === PrimitiveAlignment.AlignLeft && this.vertical === PrimitiveAlignment.AlignBottom;
            },
            enumerable: true,
            configurable: true
        });
        PrimitiveAlignment._AlignLeft = 1;
        PrimitiveAlignment._AlignTop = 1; // Same as left
        PrimitiveAlignment._AlignRight = 2;
        PrimitiveAlignment._AlignBottom = 2; // Same as right
        PrimitiveAlignment._AlignCenter = 3;
        PrimitiveAlignment._AlignStretch = 4;
        PrimitiveAlignment = __decorate([
            BABYLON.className("PrimitiveAlignment", "BABYLON")
        ], PrimitiveAlignment);
        return PrimitiveAlignment;
    }());
    BABYLON.PrimitiveAlignment = PrimitiveAlignment;
    /**
     * Stores information about a Primitive that was intersected
     */
    var PrimitiveIntersectedInfo = (function () {
        function PrimitiveIntersectedInfo(prim, intersectionLocation) {
            this.prim = prim;
            this.intersectionLocation = intersectionLocation;
        }
        return PrimitiveIntersectedInfo;
    }());
    BABYLON.PrimitiveIntersectedInfo = PrimitiveIntersectedInfo;
    /**
     * Define a thickness toward every edges of a Primitive to allow margin and padding.
     * The thickness can be expressed as pixels, percentages, inherit the value of the parent primitive or be auto.
     */
    var PrimitiveThickness = (function () {
        function PrimitiveThickness(parentAccess, changedCallback) {
            this._parentAccess = parentAccess;
            this._changedCallback = changedCallback;
            this._pixels = new Array(4);
            this._percentages = new Array(4);
            this._setType(0, PrimitiveThickness.Auto);
            this._setType(1, PrimitiveThickness.Auto);
            this._setType(2, PrimitiveThickness.Auto);
            this._setType(3, PrimitiveThickness.Auto);
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
        }
        /**
         * Set the thickness from a string value
         * @param thickness format is "top: <value>, left:<value>, right:<value>, bottom:<value>" or "<value>" (same for all edges) each are optional, auto will be set if it's omitted.
         * Values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        PrimitiveThickness.prototype.fromString = function (thickness) {
            this._clear();
            var m = thickness.trim().split(",");
            // Special case, one value to apply to all edges
            if (m.length === 1 && thickness.indexOf(":") === -1) {
                this._setStringValue(m[0], 0, false);
                this._setStringValue(m[0], 1, false);
                this._setStringValue(m[0], 2, false);
                this._setStringValue(m[0], 3, false);
                this.onChangeCallback();
                return;
            }
            var res = false;
            for (var _i = 0, m_2 = m; _i < m_2.length; _i++) {
                var cm = m_2[_i];
                res = this._extractString(cm, false) || res;
            }
            if (!res) {
                throw new Error("Can't parse the string to create a PrimitiveMargin object, format must be: 'top: <value>, left:<value>, right:<value>, bottom:<value>");
            }
            // Check the margin that weren't set and set them in auto
            if ((this._flags & 0x000F) === 0)
                this._flags |= PrimitiveThickness.Pixel << 0;
            if ((this._flags & 0x00F0) === 0)
                this._flags |= PrimitiveThickness.Pixel << 4;
            if ((this._flags & 0x0F00) === 0)
                this._flags |= PrimitiveThickness.Pixel << 8;
            if ((this._flags & 0xF000) === 0)
                this._flags |= PrimitiveThickness.Pixel << 12;
            this.onChangeCallback();
        };
        /**
         * Set the thickness from multiple string
         * Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         * @param top the top thickness to set
         * @param left the left thickness to set
         * @param right the right thickness to set
         * @param bottom the bottom thickness to set
         */
        PrimitiveThickness.prototype.fromStrings = function (top, left, right, bottom) {
            this._clear();
            this._setStringValue(top, 0, false);
            this._setStringValue(left, 1, false);
            this._setStringValue(right, 2, false);
            this._setStringValue(bottom, 3, false);
            this.onChangeCallback();
            return this;
        };
        /**
         * Set the thickness from pixel values
         * @param top the top thickness in pixels to set
         * @param left the left thickness in pixels to set
         * @param right the right thickness in pixels to set
         * @param bottom the bottom thickness in pixels to set
         */
        PrimitiveThickness.prototype.fromPixels = function (top, left, right, bottom) {
            this._clear();
            this._pixels[0] = top;
            this._pixels[1] = left;
            this._pixels[2] = right;
            this._pixels[3] = bottom;
            this.onChangeCallback();
            return this;
        };
        /**
         * Apply the same pixel value to all edges
         * @param margin the value to set, in pixels.
         */
        PrimitiveThickness.prototype.fromUniformPixels = function (margin) {
            this._clear();
            this._pixels[0] = margin;
            this._pixels[1] = margin;
            this._pixels[2] = margin;
            this._pixels[3] = margin;
            this.onChangeCallback();
            return this;
        };
        PrimitiveThickness.prototype.copyFrom = function (pt) {
            this._clear();
            for (var i = 0; i < 4; i++) {
                this._pixels[i] = pt._pixels[i];
                this._percentages[i] = pt._percentages[i];
            }
            this._flags = pt._flags;
            this.onChangeCallback();
        };
        /**
         * Set all edges in auto
         */
        PrimitiveThickness.prototype.auto = function () {
            this._clear();
            this._flags = (PrimitiveThickness.Auto << 0) | (PrimitiveThickness.Auto << 4) | (PrimitiveThickness.Auto << 8) | (PrimitiveThickness.Auto << 12);
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
            this.onChangeCallback();
            return this;
        };
        PrimitiveThickness.prototype._clear = function () {
            this._flags = 0;
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
            this._percentages[0] = null;
            this._percentages[1] = null;
            this._percentages[2] = null;
            this._percentages[3] = null;
        };
        PrimitiveThickness.prototype._extractString = function (value, emitChanged) {
            var v = value.trim().toLocaleLowerCase();
            if (v.indexOf("top:") === 0) {
                v = v.substr(4).trim();
                return this._setStringValue(v, 0, emitChanged);
            }
            if (v.indexOf("left:") === 0) {
                v = v.substr(5).trim();
                return this._setStringValue(v, 1, emitChanged);
            }
            if (v.indexOf("right:") === 0) {
                v = v.substr(6).trim();
                return this._setStringValue(v, 2, emitChanged);
            }
            if (v.indexOf("bottom:") === 0) {
                v = v.substr(7).trim();
                return this._setStringValue(v, 3, emitChanged);
            }
            return false;
        };
        PrimitiveThickness.prototype._setStringValue = function (value, index, emitChanged) {
            // Check for auto
            var v = value.trim().toLocaleLowerCase();
            if (v === "auto") {
                if (this._isType(index, PrimitiveThickness.Auto)) {
                    return true;
                }
                this._setType(index, PrimitiveThickness.Auto);
                this._pixels[index] = 0;
                if (emitChanged) {
                    this.onChangeCallback();
                }
            }
            else if (v === "inherit") {
                if (this._isType(index, PrimitiveThickness.Inherit)) {
                    return true;
                }
                this._setType(index, PrimitiveThickness.Inherit);
                this._pixels[index] = null;
                if (emitChanged) {
                    this.onChangeCallback();
                }
            }
            else {
                var pI = v.indexOf("%");
                // Check for percentage
                if (pI !== -1) {
                    var n_1 = v.substr(0, pI);
                    var number_1 = Math.round(Number(n_1)) / 100; // Normalize the percentage to [0;1] with a 0.01 precision
                    if (this._isType(index, PrimitiveThickness.Percentage) && (this._percentages[index] === number_1)) {
                        return true;
                    }
                    this._setType(index, PrimitiveThickness.Percentage);
                    if (isNaN(number_1)) {
                        return false;
                    }
                    this._percentages[index] = number_1;
                    if (emitChanged) {
                        this.onChangeCallback();
                    }
                    return true;
                }
                // Check for pixel
                var n = void 0;
                pI = v.indexOf("px");
                if (pI !== -1) {
                    n = v.substr(0, pI).trim();
                }
                else {
                    n = v;
                }
                var number = Number(n);
                if (this._isType(index, PrimitiveThickness.Pixel) && (this._pixels[index] === number)) {
                    return true;
                }
                if (isNaN(number)) {
                    return false;
                }
                this._pixels[index] = number;
                this._setType(index, PrimitiveThickness.Pixel);
                if (emitChanged) {
                    this.onChangeCallback();
                }
                return true;
            }
        };
        PrimitiveThickness.prototype._setPixels = function (value, index, emitChanged) {
            // Round the value because, well, it's the thing to do! Otherwise we'll have sub-pixel stuff, and the no change comparison just below will almost never work for PrimitiveThickness values inside a hierarchy of Primitives
            value = Math.round(value);
            if (this._isType(index, PrimitiveThickness.Pixel) && this._pixels[index] === value) {
                return;
            }
            this._setType(index, PrimitiveThickness.Pixel);
            this._pixels[index] = value;
            if (emitChanged) {
                this.onChangeCallback();
            }
        };
        PrimitiveThickness.prototype._setPercentage = function (value, index, emitChanged) {
            // Clip Value to bounds
            value = Math.min(1, value);
            value = Math.max(0, value);
            value = Math.round(value * 100) / 100; // 0.01 precision
            if (this._isType(index, PrimitiveThickness.Percentage) && this._percentages[index] === value) {
                return;
            }
            this._setType(index, PrimitiveThickness.Percentage);
            this._percentages[index] = value;
            if (emitChanged) {
                this.onChangeCallback();
            }
        };
        PrimitiveThickness.prototype._getStringValue = function (index) {
            var f = (this._flags >> (index * 4)) & 0xF;
            switch (f) {
                case PrimitiveThickness.Auto:
                    return "auto";
                case PrimitiveThickness.Pixel:
                    return this._pixels[index] + "px";
                case PrimitiveThickness.Percentage:
                    return this._percentages[index] * 100 + "%";
                case PrimitiveThickness.Inherit:
                    return "inherit";
            }
            return "";
        };
        PrimitiveThickness.prototype._isType = function (index, type) {
            var f = (this._flags >> (index * 4)) & 0xF;
            return f === type;
        };
        PrimitiveThickness.prototype._getType = function (index, processInherit) {
            var t = (this._flags >> (index * 4)) & 0xF;
            if (processInherit && (t === PrimitiveThickness.Inherit)) {
                var p = this._parentAccess();
                if (p) {
                    return p._getType(index, true);
                }
                return PrimitiveThickness.Auto;
            }
            return t;
        };
        PrimitiveThickness.prototype._setType = function (index, type) {
            this._flags &= ~(0xF << (index * 4));
            this._flags |= type << (index * 4);
        };
        PrimitiveThickness.prototype.setTop = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 0, true);
            }
            else {
                this.topPixels = value;
            }
        };
        PrimitiveThickness.prototype.setLeft = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 1, true);
            }
            else {
                this.leftPixels = value;
            }
        };
        PrimitiveThickness.prototype.setRight = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 2, true);
            }
            else {
                this.rightPixels = value;
            }
        };
        PrimitiveThickness.prototype.setBottom = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 3, true);
            }
            else {
                this.bottomPixels = value;
            }
        };
        Object.defineProperty(PrimitiveThickness.prototype, "top", {
            /**
             * Get/set the top thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(0);
            },
            set: function (value) {
                this._setStringValue(value, 0, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "left", {
            /**
             * Get/set the left thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(1);
            },
            set: function (value) {
                this._setStringValue(value, 1, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "right", {
            /**
             * Get/set the right thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(2);
            },
            set: function (value) {
                this._setStringValue(value, 2, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottom", {
            /**
             * Get/set the bottom thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(3);
            },
            set: function (value) {
                this._setStringValue(value, 3, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "topPixels", {
            /**
             * Get/set the top thickness in pixel.
             */
            get: function () {
                return this._pixels[0];
            },
            set: function (value) {
                this._setPixels(value, 0, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "leftPixels", {
            /**
             * Get/set the left thickness in pixel.
             */
            get: function () {
                return this._pixels[1];
            },
            set: function (value) {
                this._setPixels(value, 1, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "rightPixels", {
            /**
             * Get/set the right thickness in pixel.
             */
            get: function () {
                return this._pixels[2];
            },
            set: function (value) {
                this._setPixels(value, 2, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottomPixels", {
            /**
             * Get/set the bottom thickness in pixel.
             */
            get: function () {
                return this._pixels[3];
            },
            set: function (value) {
                this._setPixels(value, 3, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "topPercentage", {
            /**
             * Get/set the top thickness in percentage.
             * The get will return a valid value only if the edge type is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[0];
            },
            set: function (value) {
                this._setPercentage(value, 0, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "leftPercentage", {
            /**
             * Get/set the left thickness in percentage.
             * The get will return a valid value only if the edge mode is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[1];
            },
            set: function (value) {
                this._setPercentage(value, 1, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "rightPercentage", {
            /**
             * Get/set the right thickness in percentage.
             * The get will return a valid value only if the edge mode is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[2];
            },
            set: function (value) {
                this._setPercentage(value, 2, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottomPercentage", {
            /**
             * Get/set the bottom thickness in percentage.
             * The get will return a valid value only if the edge mode is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[3];
            },
            set: function (value) {
                this._setPercentage(value, 3, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "topMode", {
            /**
             * Get/set the top mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(0, false);
            },
            set: function (mode) {
                this._setType(0, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "leftMode", {
            /**
             * Get/set the left mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(1, false);
            },
            set: function (mode) {
                this._setType(1, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "rightMode", {
            /**
             * Get/set the right mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(2, false);
            },
            set: function (mode) {
                this._setType(2, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottomMode", {
            /**
             * Get/set the bottom mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(3, false);
            },
            set: function (mode) {
                this._setType(3, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "isDefault", {
            get: function () {
                return this._flags === 0x1111;
            },
            enumerable: true,
            configurable: true
        });
        PrimitiveThickness.prototype._computePixels = function (index, sourceArea, emitChanged) {
            var type = this._getType(index, false);
            if (type === PrimitiveThickness.Inherit) {
                this._parentAccess()._computePixels(index, sourceArea, emitChanged);
                return;
            }
            if (type !== PrimitiveThickness.Percentage) {
                return;
            }
            var pixels = ((index === 0 || index === 3) ? sourceArea.height : sourceArea.width) * this._percentages[index];
            this._pixels[index] = pixels;
            if (emitChanged) {
                this.onChangeCallback();
            }
        };
        PrimitiveThickness.prototype.onChangeCallback = function () {
            if (this._changedCallback) {
                this._changedCallback();
            }
        };
        /**
         * Compute the positioning/size of an area considering the thickness of this object and a given alignment
         * @param sourceArea the source area where the content must be sized/positioned
         * @param contentSize the content size to position/resize
         * @param alignment the alignment setting
         * @param dstOffset the position of the content, x, y, z, w are left, bottom, right, top
         * @param dstArea the new size of the content
         */
        PrimitiveThickness.prototype.computeWithAlignment = function (sourceArea, contentSize, alignment, dstOffset, dstArea, computeLayoutArea) {
            if (computeLayoutArea === void 0) { computeLayoutArea = false; }
            // Fetch some data
            var topType = this._getType(0, true);
            var leftType = this._getType(1, true);
            var rightType = this._getType(2, true);
            var bottomType = this._getType(3, true);
            var hasWidth = contentSize && (contentSize.width != null);
            var hasHeight = contentSize && (contentSize.height != null);
            var width = hasWidth ? contentSize.width : 0;
            var height = hasHeight ? contentSize.height : 0;
            var isTopAuto = topType === PrimitiveThickness.Auto;
            var isLeftAuto = leftType === PrimitiveThickness.Auto;
            var isRightAuto = rightType === PrimitiveThickness.Auto;
            var isBottomAuto = bottomType === PrimitiveThickness.Auto;
            switch (alignment.horizontal) {
                case PrimitiveAlignment.AlignLeft:
                    {
                        if (isLeftAuto) {
                            dstOffset.x = 0;
                        }
                        else {
                            this._computePixels(1, sourceArea, true);
                            dstOffset.x = this.leftPixels;
                        }
                        dstArea.width = width;
                        if (computeLayoutArea) {
                            dstArea.width += this.leftPixels;
                        }
                        dstOffset.z = sourceArea.width - (dstOffset.x + width);
                        break;
                    }
                case PrimitiveAlignment.AlignRight:
                    {
                        if (isRightAuto) {
                            dstOffset.x = Math.round(sourceArea.width - width);
                        }
                        else {
                            this._computePixels(2, sourceArea, true);
                            dstOffset.x = Math.round(sourceArea.width - (width + this.rightPixels));
                        }
                        dstArea.width = width;
                        if (computeLayoutArea) {
                            dstArea.width += this.rightPixels;
                        }
                        dstOffset.z = this.rightPixels;
                        break;
                    }
                case PrimitiveAlignment.AlignStretch:
                    {
                        if (isLeftAuto) {
                            dstOffset.x = 0;
                        }
                        else {
                            this._computePixels(1, sourceArea, true);
                            dstOffset.x = this.leftPixels;
                        }
                        var right = 0;
                        if (!isRightAuto) {
                            this._computePixels(2, sourceArea, true);
                            right = this.rightPixels;
                        }
                        dstArea.width = sourceArea.width - (dstOffset.x + right);
                        dstOffset.z = this.rightPixels;
                        break;
                    }
                case PrimitiveAlignment.AlignCenter:
                    {
                        if (!isLeftAuto) {
                            this._computePixels(1, sourceArea, true);
                        }
                        if (!isRightAuto) {
                            this._computePixels(2, sourceArea, true);
                        }
                        var offset = (isLeftAuto ? 0 : this.leftPixels) - (isRightAuto ? 0 : this.rightPixels);
                        dstOffset.x = Math.round(((sourceArea.width - width) / 2) + offset);
                        dstArea.width = width;
                        dstOffset.z = sourceArea.width - (dstOffset.x + width);
                        break;
                    }
            }
            switch (alignment.vertical) {
                case PrimitiveAlignment.AlignTop:
                    {
                        if (isTopAuto) {
                            dstOffset.y = sourceArea.height - height;
                        }
                        else {
                            this._computePixels(0, sourceArea, true);
                            dstOffset.y = Math.round(sourceArea.height - (height + this.topPixels));
                        }
                        dstArea.height = height;
                        if (computeLayoutArea) {
                            dstArea.height += this.topPixels;
                        }
                        dstOffset.w = this.topPixels;
                        break;
                    }
                case PrimitiveAlignment.AlignBottom:
                    {
                        if (isBottomAuto) {
                            dstOffset.y = 0;
                        }
                        else {
                            this._computePixels(3, sourceArea, true);
                            dstOffset.y = this.bottomPixels;
                        }
                        dstArea.height = height;
                        if (computeLayoutArea) {
                            dstArea.height += this.bottomPixels;
                        }
                        dstOffset.w = sourceArea.height - (dstOffset.y + height);
                        break;
                    }
                case PrimitiveAlignment.AlignStretch:
                    {
                        if (isBottomAuto) {
                            dstOffset.y = 0;
                        }
                        else {
                            this._computePixels(3, sourceArea, true);
                            dstOffset.y = this.bottomPixels;
                        }
                        var top_1 = 0;
                        if (!isTopAuto) {
                            this._computePixels(0, sourceArea, true);
                            top_1 = this.topPixels;
                        }
                        dstArea.height = sourceArea.height - (dstOffset.y + top_1);
                        dstOffset.w = this.topPixels;
                        break;
                    }
                case PrimitiveAlignment.AlignCenter:
                    {
                        if (!isTopAuto) {
                            this._computePixels(0, sourceArea, true);
                        }
                        if (!isBottomAuto) {
                            this._computePixels(3, sourceArea, true);
                        }
                        var offset = (isBottomAuto ? 0 : this.bottomPixels) - (isTopAuto ? 0 : this.topPixels);
                        dstOffset.y = Math.round(((sourceArea.height - height) / 2) + offset);
                        dstArea.height = height;
                        dstOffset.w = sourceArea.height - (dstOffset.y + height);
                        break;
                    }
            }
        };
        /**
         * Compute an area and its position considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param dstOffset the position of the resulting area
         * @param dstArea the size of the resulting area
         */
        PrimitiveThickness.prototype.compute = function (sourceArea, dstOffset, dstArea) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);
            dstOffset.x = this.leftPixels;
            dstArea.width = sourceArea.width - (dstOffset.x + this.rightPixels);
            dstOffset.y = this.bottomPixels;
            dstArea.height = sourceArea.height - (dstOffset.y + this.topPixels);
        };
        /**
         * Compute an area considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param result the resulting area
         */
        PrimitiveThickness.prototype.computeArea = function (sourceArea, result) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);
            result.width = this.leftPixels + sourceArea.width + this.rightPixels;
            result.height = this.bottomPixels + sourceArea.height + this.topPixels;
        };
        PrimitiveThickness.prototype.enlarge = function (sourceArea, dstOffset, enlargedArea) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);
            dstOffset.x = this.leftPixels;
            enlargedArea.width = sourceArea.width + (dstOffset.x + this.rightPixels);
            dstOffset.y = this.bottomPixels;
            enlargedArea.height = sourceArea.height + (dstOffset.y + this.topPixels);
        };
        PrimitiveThickness.Auto = 0x1;
        PrimitiveThickness.Inherit = 0x2;
        PrimitiveThickness.Percentage = 0x4;
        PrimitiveThickness.Pixel = 0x8;
        PrimitiveThickness = __decorate([
            BABYLON.className("PrimitiveThickness", "BABYLON")
        ], PrimitiveThickness);
        return PrimitiveThickness;
    }());
    BABYLON.PrimitiveThickness = PrimitiveThickness;
    /**
     * Main class used for the Primitive Intersection API
     */
    var IntersectInfo2D = (function () {
        function IntersectInfo2D() {
            this.findFirstOnly = false;
            this.intersectHidden = false;
            this.pickPosition = BABYLON.Vector2.Zero();
        }
        Object.defineProperty(IntersectInfo2D.prototype, "isIntersected", {
            /**
             * true if at least one primitive intersected during the test
             */
            get: function () {
                return this.intersectedPrimitives && this.intersectedPrimitives.length > 0;
            },
            enumerable: true,
            configurable: true
        });
        IntersectInfo2D.prototype.isPrimIntersected = function (prim) {
            for (var _i = 0, _a = this.intersectedPrimitives; _i < _a.length; _i++) {
                var cur = _a[_i];
                if (cur.prim === prim) {
                    return cur.intersectionLocation;
                }
            }
            return null;
        };
        // Internals, don't use
        IntersectInfo2D.prototype._exit = function (firstLevel) {
            if (firstLevel) {
                this._globalPickPosition = null;
            }
        };
        return IntersectInfo2D;
    }());
    BABYLON.IntersectInfo2D = IntersectInfo2D;
    var Prim2DBase = (function (_super) {
        __extends(Prim2DBase, _super);
        function Prim2DBase(settings) {
            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }
            // BASE CLASS CALL
            _super.call(this);
            // Fetch the owner, parent. There're many ways to do it and we can end up with nothing for both
            var owner;
            var parent;
            if (Prim2DBase._isCanvasInit) {
                owner = this;
                parent = null;
                this._canvasPreInit(settings);
            }
            else {
                if (settings.parent != null) {
                    parent = settings.parent;
                    owner = settings.parent.owner;
                    if (!owner) {
                        throw new Error("Parent " + parent.id + " of " + settings.id + " doesn't have a valid owner!");
                    }
                    if (!(this instanceof BABYLON.Group2D) && !(this instanceof BABYLON.Sprite2D && settings.id != null && settings.id.indexOf("__cachedSpriteOfGroup__") === 0) && (owner.cachingStrategy === BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) && (parent === owner)) {
                        throw new Error("Can't create a primitive with the canvas as direct parent when the caching strategy is TOPLEVELGROUPS. You need to create a Group below the canvas and use it as the parent for the primitive");
                    }
                }
            }
            // Fields initialization
            this._layoutEngine = BABYLON.CanvasLayoutEngine.Singleton;
            this._size = null; //Size.Zero();
            this._scale = new BABYLON.Vector2(1, 1);
            this._actualSize = null;
            this._boundingSize = BABYLON.Size.Zero();
            this._layoutArea = BABYLON.Size.Zero();
            this._layoutAreaPos = null;
            this._layoutBoundingInfo = null;
            this._marginOffset = BABYLON.Vector4.Zero();
            this._paddingOffset = BABYLON.Vector4.Zero();
            this._parentPaddingOffset = BABYLON.Vector2.Zero();
            this._parentContentArea = BABYLON.Size.Zero();
            this._lastAutoSizeArea = BABYLON.Size.Zero();
            this._contentArea = new BABYLON.Size(null, null);
            this._pointerEventObservable = new BABYLON.Observable();
            this._boundingInfo = new BABYLON.BoundingInfo2D();
            this._owner = owner;
            this._parent = null;
            this._margin = null;
            this._padding = null;
            this._marginAlignment = null;
            this._id = settings.id;
            this._children = new Array();
            this._localTransform = new BABYLON.Matrix();
            this._globalTransform = null;
            this._invGlobalTransform = null;
            this._globalTransformProcessStep = 0;
            this._globalTransformStep = 0;
            this._renderGroup = null;
            this._primLinearPosition = 0;
            this._manualZOrder = null;
            this._zOrder = 0;
            this._zMax = 0;
            this._firstZDirtyIndex = Prim2DBase._bigInt;
            this._actualOpacity = 0;
            this._actualScale = BABYLON.Vector2.Zero();
            this._displayDebugAreas = false;
            this._debugAreaGroup = null;
            var isPickable = true;
            var isContainer = true;
            if (settings.isPickable !== undefined) {
                isPickable = settings.isPickable;
            }
            if (settings.isContainer !== undefined) {
                isContainer = settings.isContainer;
            }
            if (settings.dontInheritParentScale) {
                this._setFlags(BABYLON.SmartPropertyPrim.flagDontInheritParentScale);
            }
            this._setFlags((isPickable ? BABYLON.SmartPropertyPrim.flagIsPickable : 0) | BABYLON.SmartPropertyPrim.flagBoundingInfoDirty | BABYLON.SmartPropertyPrim.flagActualOpacityDirty | (isContainer ? BABYLON.SmartPropertyPrim.flagIsContainer : 0) | BABYLON.SmartPropertyPrim.flagActualScaleDirty | BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty);
            if (settings.opacity != null) {
                this._opacity = settings.opacity;
            }
            else {
                this._opacity = 1;
            }
            this._updateRenderMode();
            if (settings.childrenFlatZOrder) {
                this._setFlags(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
            }
            // If the parent is given, initialize the hierarchy/owner related data
            if (parent != null) {
                parent.addChild(this);
                this._hierarchyDepth = parent._hierarchyDepth + 1;
                this._patchHierarchy(parent.owner);
            }
            // If it's a group, detect its own states
            if (this.owner && this instanceof BABYLON.Group2D) {
                var group = this;
                group.detectGroupStates();
            }
            // Time to insert children if some are specified
            if (settings.children != null) {
                for (var _i = 0, _a = settings.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    this.addChild(child);
                    // Good time to patch the hierarchy, it won't go very far if there's no need to
                    if (this.owner != null) {
                        child._patchHierarchy(this.owner);
                    }
                }
            }
            if (settings.zOrder != null) {
                this.zOrder = settings.zOrder;
            }
            // Set the model related properties
            if (settings.position != null) {
                this.position = settings.position;
            }
            else if (settings.x != null || settings.y != null) {
                this.position = new BABYLON.Vector2(settings.x || 0, settings.y || 0);
            }
            else {
                this._position = null;
            }
            this.rotation = (settings.rotation == null) ? 0 : settings.rotation;
            if (settings.scale != null) {
                this.scale = settings.scale;
            }
            else {
                if (settings.scaleX != null) {
                    this.scaleX = settings.scaleX;
                }
                if (settings.scaleY != null) {
                    this.scaleY = settings.scaleY;
                }
            }
            this.levelVisible = (settings.isVisible == null) ? true : settings.isVisible;
            this.origin = settings.origin || new BABYLON.Vector2(0.5, 0.5);
            // Layout Engine
            if (settings.layoutEngine != null) {
                if (typeof settings.layoutEngine === "string") {
                    var name_1 = settings.layoutEngine.toLocaleLowerCase().trim();
                    if (name_1 === "canvas" || name_1 === "canvaslayoutengine") {
                        this.layoutEngine = BABYLON.CanvasLayoutEngine.Singleton;
                    }
                    else if (name_1.indexOf("stackpanel") === 0 || name_1.indexOf("horizontalstackpanel") === 0) {
                        this.layoutEngine = BABYLON.StackPanelLayoutEngine.Horizontal;
                    }
                    else if (name_1.indexOf("verticalstackpanel") === 0) {
                        this.layoutEngine = BABYLON.StackPanelLayoutEngine.Vertical;
                    }
                }
                else if (settings.layoutEngine instanceof BABYLON.LayoutEngineBase) {
                    this.layoutEngine = settings.layoutEngine;
                }
            }
            // Set the layout/margin stuffs
            if (settings.marginTop) {
                this.margin.setTop(settings.marginTop);
            }
            if (settings.marginLeft) {
                this.margin.setLeft(settings.marginLeft);
            }
            if (settings.marginRight) {
                this.margin.setRight(settings.marginRight);
            }
            if (settings.marginBottom) {
                this.margin.setBottom(settings.marginBottom);
            }
            if (settings.margin) {
                if (typeof settings.margin === "string") {
                    this.margin.fromString(settings.margin);
                }
                else {
                    this.margin.fromUniformPixels(settings.margin);
                }
            }
            if (settings.marginHAlignment) {
                this.marginAlignment.horizontal = settings.marginHAlignment;
            }
            if (settings.marginVAlignment) {
                this.marginAlignment.vertical = settings.marginVAlignment;
            }
            if (settings.marginAlignment) {
                this.marginAlignment.fromString(settings.marginAlignment);
            }
            if (settings.paddingTop) {
                this.padding.setTop(settings.paddingTop);
            }
            if (settings.paddingLeft) {
                this.padding.setLeft(settings.paddingLeft);
            }
            if (settings.paddingRight) {
                this.padding.setRight(settings.paddingRight);
            }
            if (settings.paddingBottom) {
                this.padding.setBottom(settings.paddingBottom);
            }
            if (settings.padding) {
                this.padding.fromString(settings.padding);
            }
            // Dirty layout and positioning
            this._parentLayoutDirty();
            this._positioningDirty();
        }
        Object.defineProperty(Prim2DBase.prototype, "actionManager", {
            get: function () {
                if (!this._actionManager) {
                    this._actionManager = new BABYLON.ActionManager(this.owner.scene);
                }
                return this._actionManager;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * From 'this' primitive, traverse up (from parent to parent) until the given predicate is true
         * @param predicate the predicate to test on each parent
         * @return the first primitive where the predicate was successful
         */
        Prim2DBase.prototype.traverseUp = function (predicate) {
            var p = this;
            while (p != null) {
                if (predicate(p)) {
                    return p;
                }
                p = p._parent;
            }
            return null;
        };
        Object.defineProperty(Prim2DBase.prototype, "owner", {
            /**
             * Retrieve the owner Canvas2D
             */
            get: function () {
                return this._owner;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "parent", {
            /**
             * Get the parent primitive (can be the Canvas, only the Canvas has no parent)
             */
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "children", {
            /**
             * The array of direct children primitives
             */
            get: function () {
                return this._children;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "id", {
            /**
             * The identifier of this primitive, may not be unique, it's for information purpose only
             */
            get: function () {
                return this._id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualPosition", {
            get: function () {
                if (this._actualPosition != null) {
                    return this._actualPosition;
                }
                if (this._position != null) {
                    return this._position;
                }
                // At least return 0,0, we can't return null on actualPosition
                return Prim2DBase._nullPosition;
            },
            /**
             * DO NOT INVOKE for internal purpose only
             */
            set: function (val) {
                this._actualPosition = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualX", {
            /**
             * Shortcut to actualPosition.x
             */
            get: function () {
                return this.actualPosition.x;
            },
            set: function (val) {
                this._actualPosition.x = val;
                this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, this._actualPosition);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualY", {
            /**
             * Shortcut to actualPosition.y
             */
            get: function () {
                return this.actualPosition.y;
            },
            set: function (val) {
                this._actualPosition.y = val;
                this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, this._actualPosition);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "position", {
            /**
             * Position of the primitive, relative to its parent.
             * BEWARE: if you change only position.x or y it won't trigger a property change and you won't have the expected behavior.
             * Use this property to set a new Vector2 object, otherwise to change only the x/y use Prim2DBase.x or y properties.
             * Setting this property may have no effect is specific alignment are in effect.
             */
            get: function () {
                return this._position || Prim2DBase._nullPosition;
            },
            set: function (value) {
                if (!this._checkPositionChange()) {
                    return;
                }
                this._position = value;
                this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "x", {
            /**
             * Direct access to the position.x value of the primitive
             * Use this property when you only want to change one component of the position property
             */
            get: function () {
                if (!this._position) {
                    return null;
                }
                return this._position.x;
            },
            set: function (value) {
                if (!this._checkPositionChange()) {
                    return;
                }
                if (!this._position) {
                    this._position = BABYLON.Vector2.Zero();
                }
                if (this._position.x === value) {
                    return;
                }
                this._position.x = value;
                this._triggerPropertyChanged(Prim2DBase.positionProperty, value);
                this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "y", {
            /**
             * Direct access to the position.y value of the primitive
             * Use this property when you only want to change one component of the position property
             */
            get: function () {
                if (!this._position) {
                    return null;
                }
                return this._position.y;
            },
            set: function (value) {
                if (!this._checkPositionChange()) {
                    return;
                }
                if (!this._position) {
                    this._position = BABYLON.Vector2.Zero();
                }
                if (this._position.y === value) {
                    return;
                }
                this._position.y = value;
                this._triggerPropertyChanged(Prim2DBase.positionProperty, value);
                this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "size", {
            /**
             * Size of the primitive or its bounding area
             * BEWARE: if you change only size.width or height it won't trigger a property change and you won't have the expected behavior.
             * Use this property to set a new Size object, otherwise to change only the width/height use Prim2DBase.width or height properties.
             */
            get: function () {
                if (!this._size || this._size.width == null || this._size.height == null) {
                    if (Prim2DBase.boundinbBoxReentrency) {
                        return Prim2DBase.nullSize;
                    }
                    if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagBoundingInfoDirty)) {
                        return this._boundingSize;
                    }
                    Prim2DBase.boundinbBoxReentrency = true;
                    var b = this.boundingInfo;
                    Prim2DBase.boundinbBoxReentrency = false;
                    return this._boundingSize;
                }
                return this._size;
            },
            set: function (value) {
                this._size = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "width", {
            /**
             * Direct access to the size.width value of the primitive
             * Use this property when you only want to change one component of the size property
             */
            get: function () {
                if (!this.size) {
                    return null;
                }
                return this.size.width;
            },
            set: function (value) {
                if (this.size && this.size.width === value) {
                    return;
                }
                if (!this.size) {
                    this.size = new BABYLON.Size(value, 0);
                }
                else {
                    this.size.width = value;
                }
                this._triggerPropertyChanged(Prim2DBase.sizeProperty, value);
                this._positioningDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "height", {
            /**
             * Direct access to the size.height value of the primitive
             * Use this property when you only want to change one component of the size property
             */
            get: function () {
                if (!this.size) {
                    return null;
                }
                return this.size.height;
            },
            set: function (value) {
                if (this.size && this.size.height === value) {
                    return;
                }
                if (!this.size) {
                    this.size = new BABYLON.Size(0, value);
                }
                else {
                    this.size.height = value;
                }
                this._triggerPropertyChanged(Prim2DBase.sizeProperty, value);
                this._positioningDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "rotation", {
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                this._rotation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "scale", {
            get: function () {
                return this._scale.x;
            },
            set: function (value) {
                this._scale.x = this._scale.y = value;
                this._setFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                this._spreadActualScaleDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualSize", {
            /**
             * Return the size of the primitive as it's being rendered into the target.
             * This value may be different of the size property when layout/alignment is used or specific primitive types can implement a custom logic through this property.
             * BEWARE: don't use the setter, it's for internal purpose only
             * Note to implementers: you have to override this property and declare if necessary a @xxxxInstanceLevel decorator
             */
            get: function () {
                if (this._actualSize) {
                    return this._actualSize;
                }
                return this._size;
            },
            set: function (value) {
                if (this._actualSize.equals(value)) {
                    return;
                }
                this._actualSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualWidth", {
            /**
             * Shortcut to actualSize.width
             */
            get: function () {
                return this.actualSize.width;
            },
            set: function (val) {
                this._actualSize.width = val;
                this._triggerPropertyChanged(Prim2DBase.actualSizeProperty, this._actualSize);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualHeight", {
            /**
             * Shortcut to actualPosition.height
             */
            get: function () {
                return this.actualSize.width;
            },
            set: function (val) {
                this._actualSize.height = val;
                this._triggerPropertyChanged(Prim2DBase.actualPositionProperty, this._actualSize);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualZOffset", {
            get: function () {
                if (this._manualZOrder != null) {
                    return this._manualZOrder;
                }
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                    this._updateZOrder();
                }
                return (1 - this._zOrder);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "minSize", {
            /**
             * Get or set the minimal size the Layout Engine should respect when computing the primitive's actualSize.
             * The Primitive's size won't be less than specified.
             * The default value depends of the Primitive type
             */
            get: function () {
                return this._minSize;
            },
            set: function (value) {
                if (this._minSize && value && this._minSize.equals(value)) {
                    return;
                }
                this._minSize = value;
                this._parentLayoutDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "maxSize", {
            /**
             * Get or set the maximal size the Layout Engine should respect when computing the primitive's actualSize.
             * The Primitive's size won't be more than specified.
             * The default value depends of the Primitive type
             */
            get: function () {
                return this._maxSize;
            },
            set: function (value) {
                if (this._maxSize && value && this._maxSize.equals(value)) {
                    return;
                }
                this._maxSize = value;
                this._parentLayoutDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "origin", {
            /**
             * The origin defines the normalized coordinate of the center of the primitive, from the bottom/left corner.
             * The origin is used only to compute transformation of the primitive, it has no meaning in the primitive local frame of reference
             * For instance:
             * 0,0 means the center is bottom/left. Which is the default for Canvas2D instances
             * 0.5,0.5 means the center is at the center of the primitive, which is default of all types of Primitives
             * 0,1 means the center is top/left
             * @returns The normalized center.
             */
            get: function () {
                return this._origin;
            },
            set: function (value) {
                this._origin = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "levelVisible", {
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagLevelVisible);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagLevelVisible, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isVisible", {
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagIsVisible);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagIsVisible, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "zOrder", {
            get: function () {
                return this._manualZOrder;
            },
            set: function (value) {
                if (this._manualZOrder === value) {
                    return;
                }
                this._manualZOrder = value;
                this.onZOrderChanged();
                if (this._actualZOrderChangedObservable && this._actualZOrderChangedObservable.hasObservers()) {
                    this._actualZOrderChangedObservable.notifyObservers(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isManualZOrder", {
            get: function () {
                return this._manualZOrder != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "margin", {
            get: function () {
                var _this = this;
                if (!this._margin) {
                    this._margin = new PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.margin;
                    }, function () { return _this._positioningDirty(); });
                }
                return this._margin;
            },
            set: function (value) {
                this.margin.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "_hasMargin", {
            /**
             * Check for both margin and marginAlignment, return true if at least one of them is specified with a non default value
             */
            get: function () {
                return (this._margin !== null && !this._margin.isDefault) || (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "padding", {
            get: function () {
                var _this = this;
                if (!this._padding) {
                    this._padding = new PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.padding;
                    }, function () { return _this._positioningDirty(); });
                }
                return this._padding;
            },
            set: function (value) {
                this.padding.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "_hasPadding", {
            get: function () {
                return this._padding !== null && !this._padding.isDefault;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "marginAlignment", {
            get: function () {
                var _this = this;
                if (!this._marginAlignment) {
                    this._marginAlignment = new PrimitiveAlignment(function () { return _this._positioningDirty(); });
                }
                return this._marginAlignment;
            },
            set: function (value) {
                this.marginAlignment.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "_hasMarginAlignment", {
            /**
             * Check if there a marginAlignment specified (non null and not default)
             */
            get: function () {
                return (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "opacity", {
            get: function () {
                return this._opacity;
            },
            set: function (value) {
                if (value < 0) {
                    value = 0;
                }
                else if (value > 1) {
                    value = 1;
                }
                if (this._opacity === value) {
                    return;
                }
                this._opacity = value;
                this._setFlags(BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
                this._spreadActualOpacityChanged();
                this._updateRenderMode();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "scaleX", {
            get: function () {
                return this._scale.x;
            },
            set: function (value) {
                this._scale.x = value;
                this._setFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                this._spreadActualScaleDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "scaleY", {
            get: function () {
                return this._scale.y;
            },
            set: function (value) {
                this._scale.y = value;
                this._setFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                this._spreadActualScaleDirty();
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype._spreadActualScaleDirty = function () {
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._setFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                child._spreadActualScaleDirty();
            }
        };
        Object.defineProperty(Prim2DBase.prototype, "actualScale", {
            /**
             * Returns the actual scale of this Primitive, the value is computed from the scale property of this primitive, multiplied by the actualScale of its parent one (if any). The Vector2 object returned contains the scale for both X and Y axis
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagActualScaleDirty)) {
                    var cur = this._isFlagSet(BABYLON.SmartPropertyPrim.flagDontInheritParentScale) ? null : this.parent;
                    var sx = this.scaleX;
                    var sy = this.scaleY;
                    while (cur) {
                        sx *= cur.scaleX;
                        sy *= cur.scaleY;
                        cur = cur._isFlagSet(BABYLON.SmartPropertyPrim.flagDontInheritParentScale) ? null : cur.parent;
                    }
                    this._actualScale.copyFromFloats(sx, sy);
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                }
                return this._actualScale;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualScaleX", {
            /**
             * Get the actual Scale of the X axis, shortcut for this.actualScale.x
             */
            get: function () {
                return this.actualScale.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualScaleY", {
            /**
             * Get the actual Scale of the Y axis, shortcut for this.actualScale.y
             */
            get: function () {
                return this.actualScale.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualOpacity", {
            /**
             * Get the actual opacity level, this property is computed from the opacity property, multiplied by the actualOpacity of its parent (if any)
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagActualOpacityDirty)) {
                    var cur = this.parent;
                    var op = this.opacity;
                    while (cur) {
                        op *= cur.opacity;
                        cur = cur.parent;
                    }
                    this._actualOpacity = op;
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
                }
                return this._actualOpacity;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutEngine", {
            /**
             * Get/set the layout engine to use for this primitive.
             * The default layout engine is the CanvasLayoutEngine.
             */
            get: function () {
                if (!this._layoutEngine) {
                    this._layoutEngine = BABYLON.CanvasLayoutEngine.Singleton;
                }
                return this._layoutEngine;
            },
            set: function (value) {
                if (this._layoutEngine === value) {
                    return;
                }
                this._changeLayoutEngine(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutArea", {
            /**
             * Get/set the layout are of this primitive.
             * The Layout area is the zone allocated by the Layout Engine for this particular primitive. Margins/Alignment will be computed based on this area.
             * The setter should only be called by a Layout Engine class.
             */
            get: function () {
                return this._layoutArea;
            },
            set: function (val) {
                if (this._layoutArea.equals(val)) {
                    return;
                }
                this._positioningDirty();
                if (this.parent) {
                    this.parent._setFlags(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty);
                }
                this._layoutArea = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutAreaPos", {
            /**
             * Get/set the layout area position (relative to the parent primitive).
             * The setter should only be called by a Layout Engine class.
             */
            get: function () {
                return this._layoutAreaPos || Prim2DBase._nullPosition;
            },
            set: function (val) {
                if (this._layoutAreaPos && this._layoutAreaPos.equals(val)) {
                    return;
                }
                if (this.parent) {
                    this.parent._setFlags(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty);
                }
                this._positioningDirty();
                this._layoutAreaPos = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isPickable", {
            /**
             * Define if the Primitive can be subject to intersection test or not (default is true)
             */
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagIsPickable);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagIsPickable, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isContainer", {
            /**
             * Define if the Primitive acts as a container or not
             * A container will encapsulate its children for interaction event.
             * If it's not a container events will be process down to children if the primitive is not pickable.
             * Default value is true
             */
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagIsContainer);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagIsContainer, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "hierarchyDepth", {
            /**
             * Return the depth level of the Primitive into the Canvas' Graph. A Canvas will be 0, its direct children 1, and so on.
             */
            get: function () {
                return this._hierarchyDepth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "renderGroup", {
            /**
             * Retrieve the Group that is responsible to render this primitive
             */
            get: function () {
                return this._renderGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "globalTransform", {
            /**
             * Get the global transformation matrix of the primitive
             */
            get: function () {
                this._updateLocalTransform();
                return this._globalTransform;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * return the global position of the primitive, relative to its canvas
         */
        Prim2DBase.prototype.getGlobalPosition = function () {
            var v = new BABYLON.Vector2(0, 0);
            this.getGlobalPositionByRef(v);
            return v;
        };
        /**
         * return the global position of the primitive, relative to its canvas
         * @param v the valid Vector2 object where the global position will be stored
         */
        Prim2DBase.prototype.getGlobalPositionByRef = function (v) {
            v.x = this.globalTransform.m[12];
            v.y = this.globalTransform.m[13];
        };
        Object.defineProperty(Prim2DBase.prototype, "invGlobalTransform", {
            /**
             * Get invert of the global transformation matrix of the primitive
             */
            get: function () {
                this._updateLocalTransform();
                return this._invGlobalTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "localTransform", {
            /**
             * Get the local transformation of the primitive
             */
            get: function () {
                this._updateLocalTransform();
                return this._localTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "boundingInfo", {
            /**
             * Get the boundingInfo associated to the primitive and its children.
             * The value is supposed to be always up to date
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagBoundingInfoDirty)) {
                    if (this.owner) {
                        this.owner.boundingInfoRecomputeCounter.addCount(1, false);
                    }
                    if (this.isSizedByContent) {
                        this._boundingInfo.clear();
                    }
                    else {
                        this._boundingInfo.copyFrom(this.levelBoundingInfo);
                    }
                    var bi = this._boundingInfo;
                    var tps = new BABYLON.BoundingInfo2D();
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var curChild = _a[_i];
                        var bb = curChild.boundingInfo;
                        bb.transformToRef(curChild.localTransform, tps);
                        bi.unionToRef(tps, bi);
                    }
                    this._boundingInfo.maxToRef(Prim2DBase._bMax);
                    this._boundingSize.copyFromFloats((!this._size || this._size.width == null) ? Math.ceil(Prim2DBase._bMax.x) : this._size.width, (!this._size || this._size.height == null) ? Math.ceil(Prim2DBase._bMax.y) : this._size.height);
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagBoundingInfoDirty);
                }
                return this._boundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutBoundingInfo", {
            /**
             * Get the boundingInfo of the primitive's content arranged by a layout Engine
             * If a particular child is not arranged by layout, it's boundingInfo is used instead to produce something as accurate as possible
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty)) {
                    if (!this._layoutBoundingInfo) {
                        this._layoutBoundingInfo = new BABYLON.BoundingInfo2D();
                    }
                    if (this.isSizedByContent) {
                        this._layoutBoundingInfo.clear();
                    }
                    else {
                        this._layoutBoundingInfo.copyFrom(this.levelBoundingInfo);
                    }
                    var bi = this._layoutBoundingInfo;
                    var tps = new BABYLON.BoundingInfo2D();
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var curChild = _a[_i];
                        var bb = void 0;
                        if (curChild._layoutAreaPos) {
                            var s = curChild._layoutArea;
                            BABYLON.BoundingInfo2D.CreateFromMinMaxToRef(0, s.width, 0, s.height, Prim2DBase._tpsBB);
                            bb = Prim2DBase._tpsBB;
                        }
                        else {
                            bb = curChild.boundingInfo;
                        }
                        bb.transformToRef(curChild.localTransform, tps);
                        bi.unionToRef(tps, bi);
                    }
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty);
                }
                return this._layoutBoundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isSizeAuto", {
            /**
             * Determine if the size is automatically computed or fixed because manually specified.
             * Use the actualSize property to get the final/real size of the primitive
             * @returns true if the size is automatically computed, false if it were manually specified.
             */
            get: function () {
                return this._size == null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isSizedByContent", {
            /**
             * Return true if this prim has an auto size which is set by the children's global bounding box
             */
            get: function () {
                return (this._size == null) && (this._children.length > 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isPositionAuto", {
            /**
             * Determine if the position is automatically computed or fixed because manually specified.
             * Use the actualPosition property to get the final/real position of the primitive
             * @returns true if the position is automatically computed, false if it were manually specified.
             */
            get: function () {
                return this._position == null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "pointerEventObservable", {
            /**
             * Interaction with the primitive can be create using this Observable. See the PrimitivePointerInfo class for more information
             */
            get: function () {
                return this._pointerEventObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "zActualOrderChangedObservable", {
            get: function () {
                if (!this._actualZOrderChangedObservable) {
                    this._actualZOrderChangedObservable = new BABYLON.Observable();
                }
                return this._actualZOrderChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "displayDebugAreas", {
            get: function () {
                return this._displayDebugAreas;
            },
            set: function (value) {
                if (this._displayDebugAreas === value) {
                    return;
                }
                if (value === false) {
                    this._debugAreaGroup.dispose();
                    this._debugAreaGroup = null;
                }
                else {
                    var layoutFill = "#F0808040"; // Red - Layout area
                    var layoutBorder = "#F08080FF";
                    var marginFill = "#F0F04040"; // Yellow - Margin area
                    var marginBorder = "#F0F040FF";
                    var paddingFill = "#F040F040"; // Magenta - Padding Area
                    var paddingBorder = "#F040F0FF";
                    var contentFill = "#40F0F040"; // Cyan - Content area
                    var contentBorder = "#40F0F0FF";
                    var s = new BABYLON.Size(10, 10);
                    var p = BABYLON.Vector2.Zero();
                    this._debugAreaGroup = new BABYLON.Group2D({
                        parent: (this.parent != null) ? this.parent : this, id: "###DEBUG AREA GROUP###", children: [
                            new BABYLON.Group2D({
                                id: "###Layout Area###", position: p, size: s, children: [
                                    new BABYLON.Rectangle2D({ id: "###Layout Frame###", position: BABYLON.Vector2.Zero(), size: s, fill: null, border: layoutBorder }),
                                    new BABYLON.Rectangle2D({ id: "###Layout Top###", position: BABYLON.Vector2.Zero(), size: s, fill: layoutFill }),
                                    new BABYLON.Rectangle2D({ id: "###Layout Left###", position: BABYLON.Vector2.Zero(), size: s, fill: layoutFill }),
                                    new BABYLON.Rectangle2D({ id: "###Layout Right###", position: BABYLON.Vector2.Zero(), size: s, fill: layoutFill }),
                                    new BABYLON.Rectangle2D({ id: "###Layout Bottom###", position: BABYLON.Vector2.Zero(), size: s, fill: layoutFill })
                                ]
                            }),
                            new BABYLON.Group2D({
                                id: "###Margin Area###", position: p, size: s, children: [
                                    new BABYLON.Rectangle2D({ id: "###Margin Frame###", position: BABYLON.Vector2.Zero(), size: s, fill: null, border: marginBorder }),
                                    new BABYLON.Rectangle2D({ id: "###Margin Top###", position: BABYLON.Vector2.Zero(), size: s, fill: marginFill }),
                                    new BABYLON.Rectangle2D({ id: "###Margin Left###", position: BABYLON.Vector2.Zero(), size: s, fill: marginFill }),
                                    new BABYLON.Rectangle2D({ id: "###Margin Right###", position: BABYLON.Vector2.Zero(), size: s, fill: marginFill }),
                                    new BABYLON.Rectangle2D({ id: "###Margin Bottom###", position: BABYLON.Vector2.Zero(), size: s, fill: marginFill })
                                ]
                            }),
                            new BABYLON.Group2D({
                                id: "###Padding Area###", position: p, size: s, children: [
                                    new BABYLON.Rectangle2D({ id: "###Padding Frame###", position: BABYLON.Vector2.Zero(), size: s, fill: null, border: paddingBorder }),
                                    new BABYLON.Rectangle2D({ id: "###Padding Top###", position: BABYLON.Vector2.Zero(), size: s, fill: paddingFill }),
                                    new BABYLON.Rectangle2D({ id: "###Padding Left###", position: BABYLON.Vector2.Zero(), size: s, fill: paddingFill }),
                                    new BABYLON.Rectangle2D({ id: "###Padding Right###", position: BABYLON.Vector2.Zero(), size: s, fill: paddingFill }),
                                    new BABYLON.Rectangle2D({ id: "###Padding Bottom###", position: BABYLON.Vector2.Zero(), size: s, fill: paddingFill })
                                ]
                            }),
                            new BABYLON.Group2D({
                                id: "###Content Area###", position: p, size: s, children: [
                                    new BABYLON.Rectangle2D({ id: "###Content Frame###", position: BABYLON.Vector2.Zero(), size: s, fill: null, border: contentBorder }),
                                    new BABYLON.Rectangle2D({ id: "###Content Top###", position: BABYLON.Vector2.Zero(), size: s, fill: contentFill }),
                                    new BABYLON.Rectangle2D({ id: "###Content Left###", position: BABYLON.Vector2.Zero(), size: s, fill: contentFill }),
                                    new BABYLON.Rectangle2D({ id: "###Content Right###", position: BABYLON.Vector2.Zero(), size: s, fill: contentFill }),
                                    new BABYLON.Rectangle2D({ id: "###Content Bottom###", position: BABYLON.Vector2.Zero(), size: s, fill: contentFill })
                                ]
                            })
                        ]
                    });
                    this._debugAreaGroup._setFlags(BABYLON.SmartPropertyPrim.flagNoPartOfLayout);
                    this._updateDebugArea();
                }
                this._displayDebugAreas = value;
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype._updateDebugArea = function () {
            var areaNames = ["Layout", "Margin", "Padding", "Content"];
            var areaZones = ["Area", "Frame", "Top", "Left", "Right", "Bottom"];
            var prims = new Array(4);
            // Get all the primitives used to display the areas
            for (var i = 0; i < 4; i++) {
                prims[i] = new Array(6);
                for (var j = 0; j < 6; j++) {
                    prims[i][j] = this._debugAreaGroup.findById("###" + areaNames[i] + " " + areaZones[j] + "###");
                    if (j > 1) {
                        prims[i][j].levelVisible = false;
                    }
                }
            }
            // Update the visibility status of layout/margin/padding
            var hasLayout = this._layoutAreaPos != null;
            var hasPos = (this.actualPosition.x !== 0) || (this.actualPosition.y !== 0);
            var hasMargin = this._hasMargin;
            var hasPadding = this._hasPadding;
            prims[0][0].levelVisible = hasLayout;
            prims[1][0].levelVisible = hasMargin;
            prims[2][0].levelVisible = hasPadding;
            prims[3][0].levelVisible = true;
            // Current offset
            var curOffset = BABYLON.Vector2.Zero();
            // Store the area info of the layout area
            var curAreaIndex = 0;
            // Store data about each area
            var areaInfo = new Array(4);
            var storeAreaInfo = function (pos, size) {
                var min = pos.clone();
                var max = pos.clone();
                if (size.width > 0) {
                    max.x += size.width;
                }
                if (size.height > 0) {
                    max.y += size.height;
                }
                areaInfo[curAreaIndex++] = { off: pos, size: size, min: min, max: max };
            };
            var marginH = this._marginOffset.x + this._marginOffset.z;
            var marginV = this._marginOffset.y + this._marginOffset.w;
            var w = hasLayout ? (this.layoutAreaPos.x + this.layoutArea.width) : (marginH + this.actualSize.width);
            var h = hasLayout ? (this.layoutAreaPos.y + this.layoutArea.height) : (marginV + this.actualSize.height);
            var pos = (!hasLayout && !hasMargin && !hasPadding && hasPos) ? this.actualPosition : BABYLON.Vector2.Zero();
            storeAreaInfo(pos, new BABYLON.Size(w, h));
            // Compute the layout related data
            if (hasLayout) {
                var layoutOffset = this.layoutAreaPos.clone();
                storeAreaInfo(layoutOffset, (hasMargin || hasPadding) ? this.layoutArea.clone() : this.actualSize.clone());
                curOffset = layoutOffset.clone();
            }
            // Compute margin data
            if (hasMargin) {
                var marginOffset = curOffset.clone();
                marginOffset.x += this._marginOffset.x;
                marginOffset.y += this._marginOffset.y;
                var marginArea = this.actualSize;
                storeAreaInfo(marginOffset, marginArea);
                curOffset = marginOffset.clone();
            }
            if (hasPadding) {
                var contentOffset = curOffset.clone();
                contentOffset.x += this._paddingOffset.x;
                contentOffset.y += this._paddingOffset.y;
                var contentArea = this.contentArea;
                storeAreaInfo(contentOffset, contentArea);
                curOffset = curOffset.add(contentOffset);
            }
            // Helper function that set the pos and size of a given prim
            var setArea = function (i, j, pos, size) {
                prims[i][j].position = pos;
                prims[i][j].size = size;
            };
            var setFullRect = function (i, pos, size) {
                var plist = prims[i];
                plist[2].levelVisible = true;
                plist[3].levelVisible = false;
                plist[4].levelVisible = false;
                plist[5].levelVisible = false;
                setArea(i, 1, pos, size);
                setArea(i, 2, pos, size);
            };
            var setQuadRect = function (i, areaIndex) {
                var plist = prims[i];
                plist[2].levelVisible = true;
                plist[3].levelVisible = true;
                plist[4].levelVisible = true;
                plist[5].levelVisible = true;
                var ca = areaInfo[areaIndex];
                var na = areaInfo[areaIndex + 1];
                var tp = new BABYLON.Vector2(ca.min.x, na.max.y);
                var ts = new BABYLON.Size(ca.size.width, ca.max.y - tp.y);
                var lp = new BABYLON.Vector2(ca.min.x, na.min.y);
                var ls = new BABYLON.Size(na.min.x - ca.min.x, na.max.y - na.min.y);
                var rp = new BABYLON.Vector2(na.max.x, na.min.y);
                var rs = new BABYLON.Size(ca.max.x - na.max.x, na.max.y - na.min.y);
                var bp = new BABYLON.Vector2(ca.min.x, ca.min.y);
                var bs = new BABYLON.Size(ca.size.width, na.min.y - ca.min.y);
                // Frame
                plist[1].position = ca.off;
                plist[1].size = ca.size;
                // Top rect
                plist[2].position = tp;
                plist[2].size = ts;
                // Left rect
                plist[3].position = lp;
                plist[3].size = ls;
                // Right rect
                plist[4].position = rp;
                plist[4].size = rs;
                // Bottom rect
                plist[5].position = bp;
                plist[5].size = bs;
            };
            var areaCount = curAreaIndex;
            curAreaIndex = 0;
            // Available zones
            var availableZones = [false, hasLayout, hasMargin, hasPadding, true];
            for (var k = 1; k < 5; k++) {
                if (availableZones[k]) {
                    var ai = areaInfo[curAreaIndex];
                    setArea(k - 1, 0, BABYLON.Vector2.Zero(), ai.size);
                    //                    setArea(k-1, 1, Vector2.Zero(), ai.size);
                    if (k === 4) {
                        setFullRect(k - 1, ai.off, ai.size);
                    }
                    else {
                        setQuadRect(k - 1, curAreaIndex);
                    }
                    ++curAreaIndex;
                }
            }
        };
        Prim2DBase.prototype.findById = function (id) {
            if (this._id === id) {
                return this;
            }
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                var r = child.findById(id);
                if (r != null) {
                    return r;
                }
            }
        };
        Prim2DBase.prototype.onZOrderChanged = function () {
        };
        Prim2DBase.prototype.levelIntersect = function (intersectInfo) {
            return false;
        };
        /**
         * Capture all the Events of the given PointerId for this primitive.
         * Don't forget to call releasePointerEventsCapture when done.
         * @param pointerId the Id of the pointer to capture the events from.
         */
        Prim2DBase.prototype.setPointerEventCapture = function (pointerId) {
            return this.owner._setPointerCapture(pointerId, this);
        };
        /**
         * Release a captured pointer made with setPointerEventCapture.
         * @param pointerId the Id of the pointer to release the capture from.
         */
        Prim2DBase.prototype.releasePointerEventsCapture = function (pointerId) {
            return this.owner._releasePointerCapture(pointerId, this);
        };
        /**
         * Make an intersection test with the primitive, all inputs/outputs are stored in the IntersectInfo2D class, see its documentation for more information.
         * @param intersectInfo contains the settings of the intersection to perform, to setup before calling this method as well as the result, available after a call to this method.
         */
        Prim2DBase.prototype.intersect = function (intersectInfo) {
            if (!intersectInfo) {
                return false;
            }
            // If this is null it means this method is call for the first level, initialize stuffs
            var firstLevel = !intersectInfo._globalPickPosition;
            if (firstLevel) {
                // Compute the pickPosition in global space and use it to find the local position for each level down, always relative from the world to get the maximum accuracy (and speed). The other way would have been to compute in local every level down relative to its parent's local, which wouldn't be as accurate (even if javascript number is 80bits accurate).
                intersectInfo._globalPickPosition = BABYLON.Vector2.Zero();
                BABYLON.Vector2.TransformToRef(intersectInfo.pickPosition, this.globalTransform, intersectInfo._globalPickPosition);
                intersectInfo._localPickPosition = intersectInfo.pickPosition.clone();
                intersectInfo.intersectedPrimitives = new Array();
                intersectInfo.topMostIntersectedPrimitive = null;
            }
            if (!intersectInfo.intersectHidden && !this.isVisible) {
                return false;
            }
            var id = this.id;
            if (id != null && id.indexOf("__cachedSpriteOfGroup__") === 0) {
                var ownerGroup = this.getExternalData("__cachedGroup__");
                return ownerGroup.intersect(intersectInfo);
            }
            // If we're testing a cachedGroup, we must reject pointer outside its levelBoundingInfo because children primitives could be partially clipped outside so we must not accept them as intersected when it's the case (because they're not visually visible).
            var isIntersectionTest = false;
            if (this instanceof BABYLON.Group2D) {
                var g = this;
                isIntersectionTest = g.isCachedGroup;
            }
            if (isIntersectionTest && !this.levelBoundingInfo.doesIntersect(intersectInfo._localPickPosition)) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }
            // Fast rejection test with boundingInfo
            if (this.isPickable && !this.boundingInfo.doesIntersect(intersectInfo._localPickPosition)) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }
            // We hit the boundingInfo that bounds this primitive and its children, now we have to test on the primitive of this level
            var levelIntersectRes = false;
            if (this.isPickable) {
                levelIntersectRes = this.levelIntersect(intersectInfo);
                if (levelIntersectRes) {
                    var pii = new PrimitiveIntersectedInfo(this, intersectInfo._localPickPosition.clone());
                    intersectInfo.intersectedPrimitives.push(pii);
                    if (!intersectInfo.topMostIntersectedPrimitive || (intersectInfo.topMostIntersectedPrimitive.prim.actualZOffset > pii.prim.actualZOffset)) {
                        intersectInfo.topMostIntersectedPrimitive = pii;
                    }
                    // If we must stop at the first intersection, we're done, quit!
                    if (intersectInfo.findFirstOnly) {
                        intersectInfo._exit(firstLevel);
                        return true;
                    }
                }
            }
            // Recurse to children if needed
            if (!levelIntersectRes || !intersectInfo.findFirstOnly) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var curChild = _a[_i];
                    // Don't test primitive not pick able or if it's hidden and we don't test hidden ones
                    if ((!curChild.isPickable && curChild.isContainer) || (!intersectInfo.intersectHidden && !curChild.isVisible)) {
                        continue;
                    }
                    // Must compute the localPickLocation for the children level
                    BABYLON.Vector2.TransformToRef(intersectInfo._globalPickPosition, curChild.invGlobalTransform, intersectInfo._localPickPosition);
                    // If we got an intersection with the child and we only need to find the first one, quit!
                    if (curChild.intersect(intersectInfo) && intersectInfo.findFirstOnly) {
                        intersectInfo._exit(firstLevel);
                        return true;
                    }
                }
            }
            intersectInfo._exit(firstLevel);
            return intersectInfo.isIntersected;
        };
        /**
         * Move a child object into a new position regarding its siblings to change its rendering order.
         * You can also use the shortcut methods to move top/bottom: moveChildToTop, moveChildToBottom, moveToTop, moveToBottom.
         * @param child the object to move
         * @param previous the object which will be before "child", if child has to be the first among sibling, set "previous" to null.
         */
        Prim2DBase.prototype.moveChild = function (child, previous) {
            if (child.parent !== this) {
                return false;
            }
            var childIndex = this._children.indexOf(child);
            var prevIndex = previous ? this._children.indexOf(previous) : -1;
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder)) {
                this._setFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
                this._firstZDirtyIndex = Math.min(this._firstZDirtyIndex, prevIndex + 1);
            }
            this._children.splice(prevIndex + 1, 0, this._children.splice(childIndex, 1)[0]);
            return true;
        };
        /**
         * Move the given child so it's displayed on the top of all its siblings
         * @param child the primitive to move to the top
         */
        Prim2DBase.prototype.moveChildToTop = function (child) {
            return this.moveChild(child, this._children[this._children.length - 1]);
        };
        /**
         * Move the given child so it's displayed on the bottom of all its siblings
         * @param child the primitive to move to the top
         */
        Prim2DBase.prototype.moveChildToBottom = function (child) {
            return this.moveChild(child, null);
        };
        /**
         * Move this primitive to be at the top among all its sibling
         */
        Prim2DBase.prototype.moveToTop = function () {
            if (this.parent == null) {
                return false;
            }
            return this.parent.moveChildToTop(this);
        };
        /**
         * Move this primitive to be at the bottom among all its sibling
         */
        Prim2DBase.prototype.moveToBottom = function () {
            if (this.parent == null) {
                return false;
            }
            return this.parent.moveChildToBottom(this);
        };
        Prim2DBase.prototype.addChild = function (child) {
            child._parent = this;
            this._boundingBoxDirty();
            var flat = this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
            if (flat) {
                child._setFlags(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
                child._setZOrder(this._zOrder, true);
                child._zMax = this._zOrder;
            }
            else {
                this._setFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
            }
            var length = this._children.push(child);
            this._firstZDirtyIndex = Math.min(this._firstZDirtyIndex, length - 1);
        };
        /**
         * Dispose the primitive, remove it from its parent.
         */
        Prim2DBase.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._actionManager) {
                this._actionManager.dispose();
                this._actionManager = null;
            }
            // If there's a parent, remove this object from its parent list
            if (this._parent) {
                if (this instanceof BABYLON.Group2D) {
                    var g = this;
                    if (g.isRenderableGroup) {
                        var parentRenderable = this.parent.traverseUp(function (p) { return (p instanceof BABYLON.Group2D && p.isRenderableGroup); });
                        if (parentRenderable != null) {
                            var l = parentRenderable._renderableData._childrenRenderableGroups;
                            var i_1 = l.indexOf(g);
                            if (i_1 !== -1) {
                                l.splice(i_1, 1);
                            }
                        }
                    }
                }
                var i = this._parent._children.indexOf(this);
                if (i !== undefined) {
                    this._parent._children.splice(i, 1);
                }
                this._parent = null;
            }
            // Recurse dispose to children
            if (this._children) {
                while (this._children.length > 0) {
                    this._children[this._children.length - 1].dispose();
                }
            }
            return true;
        };
        Prim2DBase.prototype.onPrimBecomesDirty = function () {
            if (this._renderGroup && !this._isFlagSet(BABYLON.SmartPropertyPrim.flagPrimInDirtyList)) {
                this._renderGroup._addPrimToDirtyList(this);
                this._setFlags(BABYLON.SmartPropertyPrim.flagPrimInDirtyList);
            }
        };
        Prim2DBase.prototype._needPrepare = function () {
            return this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagVisibilityChanged | BABYLON.SmartPropertyPrim.flagModelDirty | BABYLON.SmartPropertyPrim.flagNeedRefresh) || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep);
        };
        Prim2DBase.prototype._prepareRender = function (context) {
            this._prepareRenderPre(context);
            this._prepareRenderPost(context);
        };
        Prim2DBase.prototype._prepareRenderPre = function (context) {
        };
        Prim2DBase.prototype._prepareRenderPost = function (context) {
            // Don't recurse if it's a renderable group, the content will be processed by the group itself
            if (this instanceof BABYLON.Group2D) {
                var self = this;
                if (self.isRenderableGroup) {
                    return;
                }
            }
            // Check if we need to recurse the prepare to children primitives
            //  - must have children
            //  - the global transform of this level have changed, or
            //  - the visible state of primitive has changed
            if (this._children.length > 0 && ((this._globalTransformProcessStep !== this._globalTransformStep) ||
                this.checkPropertiesDirty(Prim2DBase.isVisibleProperty.flagId))) {
                this._children.forEach(function (c) {
                    // As usual stop the recursion if we meet a renderable group
                    if (!(c instanceof BABYLON.Group2D && c.isRenderableGroup)) {
                        c._prepareRender(context);
                    }
                });
            }
            // Finally reset the dirty flags as we've processed everything
            this._clearFlags(BABYLON.SmartPropertyPrim.flagModelDirty);
            this._instanceDirtyFlags = 0;
        };
        Prim2DBase.prototype._canvasPreInit = function (settings) {
        };
        Prim2DBase.CheckParent = function (parent) {
            //if (!Prim2DBase._isCanvasInit && !parent) {
            //    throw new Error("A Primitive needs a valid Parent, it can be any kind of Primitives based types, even the Canvas (with the exception that only Group2D can be direct child of a Canvas if the cache strategy used is TOPLEVELGROUPS)");
            //}
        };
        Prim2DBase.prototype.updateCachedStatesOf = function (list, recurse) {
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var cur = list_1[_i];
                cur.updateCachedStates(recurse);
            }
        };
        Prim2DBase.prototype._parentLayoutDirty = function () {
            if (!this._parent || this._parent.isDisposed) {
                return;
            }
            this._parent._setLayoutDirty();
        };
        Prim2DBase.prototype._setLayoutDirty = function () {
            this.onPrimBecomesDirty();
            this._setFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
        };
        Prim2DBase.prototype._checkPositionChange = function () {
            if (this.parent && this.parent.layoutEngine.isChildPositionAllowed === false) {
                console.log("Can't manually set the position of " + this.id + ", the Layout Engine of its parent doesn't allow it");
                return false;
            }
            return true;
        };
        Prim2DBase.prototype._positioningDirty = function () {
            this.onPrimBecomesDirty();
            this._setFlags(BABYLON.SmartPropertyPrim.flagPositioningDirty);
        };
        Prim2DBase.prototype._spreadActualOpacityChanged = function () {
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._setFlags(BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
                child._updateRenderMode();
                child.onPrimBecomesDirty();
                child._spreadActualOpacityChanged();
            }
        };
        Prim2DBase.prototype._changeLayoutEngine = function (engine) {
            this._layoutEngine = engine;
        };
        Prim2DBase.prototype._updateLocalTransform = function () {
            var tflags = Prim2DBase.actualPositionProperty.flagId | Prim2DBase.rotationProperty.flagId | Prim2DBase.scaleProperty.flagId | Prim2DBase.scaleXProperty.flagId | Prim2DBase.scaleYProperty.flagId | Prim2DBase.originProperty.flagId;
            if (this.checkPropertiesDirty(tflags)) {
                if (this.owner) {
                    this.owner.addupdateLocalTransformCounter(1);
                }
                var rot = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 1), this._rotation);
                var local;
                var pos = this._position ? this.position : this.layoutAreaPos;
                if (this._origin.x === 0 && this._origin.y === 0) {
                    local = BABYLON.Matrix.Compose(new BABYLON.Vector3(this._scale.x, this._scale.y, 1), rot, new BABYLON.Vector3(pos.x + this._marginOffset.x, pos.y + this._marginOffset.y, 0));
                    this._localTransform = local;
                }
                else {
                    // -Origin offset
                    var as = this.actualSize;
                    BABYLON.Matrix.TranslationToRef((-as.width * this._origin.x), (-as.height * this._origin.y), 0, Prim2DBase._t0);
                    // -Origin * rotation
                    rot.toRotationMatrix(Prim2DBase._t1);
                    Prim2DBase._t0.multiplyToRef(Prim2DBase._t1, Prim2DBase._t2);
                    // -Origin * rotation * scale
                    BABYLON.Matrix.ScalingToRef(this._scale.x, this._scale.y, 1, Prim2DBase._t0);
                    Prim2DBase._t2.multiplyToRef(Prim2DBase._t0, Prim2DBase._t1);
                    // -Origin * rotation * scale * (Origin + Position)
                    BABYLON.Matrix.TranslationToRef((as.width * this._origin.x) + pos.x + this._marginOffset.x, (as.height * this._origin.y) + pos.y + this._marginOffset.y, 0, Prim2DBase._t2);
                    Prim2DBase._t1.multiplyToRef(Prim2DBase._t2, this._localTransform);
                }
                this.clearPropertiesDirty(tflags);
                this._setFlags(BABYLON.SmartPropertyPrim.flagGlobalTransformDirty);
                return true;
            }
            return false;
        };
        Prim2DBase.prototype.updateCachedStates = function (recurse) {
            if (this.isDisposed) {
                return;
            }
            this.owner.addCachedGroupRenderCounter(1);
            // Check if the parent is synced
            if (this._parent && ((this._parent._globalTransformProcessStep !== this.owner._globalTransformProcessStep) || this._parent._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagLayoutDirty | BABYLON.SmartPropertyPrim.flagPositioningDirty | BABYLON.SmartPropertyPrim.flagZOrderDirty))) {
                this._parent.updateCachedStates(false);
            }
            // Update Z-Order if needed
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                this._updateZOrder();
            }
            // Update actualSize only if there' not positioning to recompute and the size changed
            // Otherwise positioning will take care of it.
            var sizeDirty = this.checkPropertiesDirty(Prim2DBase.sizeProperty.flagId);
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty) && !this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty) && sizeDirty) {
                var size = this.size;
                if (size) {
                    if (this.size.width != null) {
                        this.actualSize.width = this.size.width;
                    }
                    if (this.size.height != null) {
                        this.actualSize.height = this.size.height;
                    }
                    this.clearPropertiesDirty(Prim2DBase.sizeProperty.flagId);
                }
            }
            var positioningDirty = this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty);
            var positioningComputed = positioningDirty && !this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty);
            // Check for layout update
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                this.owner.addUpdateLayoutCounter(1);
                this._layoutEngine.updateLayout(this);
                this._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
            }
            var autoContentChanged = false;
            if (this.isSizeAuto) {
                if (!this._lastAutoSizeArea) {
                    autoContentChanged = this.actualSize !== null;
                }
                else {
                    autoContentChanged = (!this._lastAutoSizeArea.equals(this.actualSize));
                }
            }
            // Check for positioning update
            if (!positioningComputed && (autoContentChanged || sizeDirty || this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty) || (this._parent && !this._parent.contentArea.equals(this._parentContentArea)))) {
                this._updatePositioning();
                this._clearFlags(BABYLON.SmartPropertyPrim.flagPositioningDirty);
                if (sizeDirty) {
                    this.clearPropertiesDirty(Prim2DBase.sizeProperty.flagId);
                }
                positioningComputed = true;
            }
            if (positioningComputed && this._parent) {
                this._parentContentArea.copyFrom(this._parent.contentArea);
            }
            // Check if we must update this prim
            if (this === this.owner || this._globalTransformProcessStep !== this.owner._globalTransformProcessStep) {
                this.owner.addUpdateGlobalTransformCounter(1);
                var curVisibleState = this.isVisible;
                this.isVisible = (!this._parent || this._parent.isVisible) && this.levelVisible;
                // Detect a change of visibility
                this._changeFlags(BABYLON.SmartPropertyPrim.flagVisibilityChanged, curVisibleState !== this.isVisible);
                // Get/compute the localTransform
                var localDirty = this._updateLocalTransform();
                var parentPaddingChanged = false;
                var parentPaddingOffset = Prim2DBase._v0;
                if (this._parent) {
                    parentPaddingOffset = new BABYLON.Vector2(this._parent._paddingOffset.x, this._parent._paddingOffset.y);
                    parentPaddingChanged = !parentPaddingOffset.equals(this._parentPaddingOffset);
                }
                // Check if there are changes in the parent that will force us to update the global matrix
                var parentDirty = (this._parent != null) ? (this._parent._globalTransformStep !== this._parentTransformStep) : false;
                // Check if we have to update the globalTransform
                if (!this._globalTransform || localDirty || parentDirty || parentPaddingChanged || this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagGlobalTransformDirty)) {
                    var globalTransform = this._parent ? this._parent._globalTransform : null;
                    var localTransform = void 0;
                    Prim2DBase._transMtx.copyFrom(this._localTransform);
                    Prim2DBase._transMtx.m[12] += parentPaddingOffset.x;
                    Prim2DBase._transMtx.m[13] += parentPaddingOffset.y;
                    localTransform = Prim2DBase._transMtx;
                    this._globalTransform = this._parent ? localTransform.multiply(globalTransform) : localTransform.clone();
                    this._invGlobalTransform = BABYLON.Matrix.Invert(this._globalTransform);
                    this._globalTransformStep = this.owner._globalTransformProcessStep + 1;
                    this._parentTransformStep = this._parent ? this._parent._globalTransformStep : 0;
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagGlobalTransformDirty);
                }
                this._globalTransformProcessStep = this.owner._globalTransformProcessStep;
            }
            if (recurse) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    // Stop the recursion if we meet a renderable group
                    child.updateCachedStates(!(child instanceof BABYLON.Group2D && child.isRenderableGroup));
                }
            }
        };
        Prim2DBase.prototype._updatePositioning = function () {
            if (this.owner) {
                this.owner.addUpdatePositioningCounter(1);
            }
            // From this point we assume that the primitive layoutArea is computed and up to date.
            // We know have to :
            //  1. Determine the PaddingArea and the ActualPosition based on the margin/marginAlignment properties, which will also set the size property of the primitive
            //  2. Determine the contentArea based on the padding property.
            var isSizeAuto = this.isSizeAuto;
            // Auto Create PaddingArea if there's no actualSize on width&|height to allocate the whole content available to the paddingArea where the actualSize is null
            if (!this._hasMarginAlignment && (isSizeAuto || (this.actualSize.width == null || this.actualSize.height == null))) {
                if (isSizeAuto || this.actualSize.width == null) {
                    this.marginAlignment.horizontal = PrimitiveAlignment.AlignStretch;
                }
                if (isSizeAuto || this.actualSize.height == null) {
                    this.marginAlignment.vertical = PrimitiveAlignment.AlignStretch;
                }
            }
            // Apply margin
            if (this._hasMargin) {
                this.margin.computeWithAlignment(this.layoutArea, this.size || this.actualSize, this.marginAlignment, this._marginOffset, Prim2DBase._size);
                this.actualSize = Prim2DBase._size.clone();
            }
            var po = new BABYLON.Vector2(this._paddingOffset.x, this._paddingOffset.y);
            if (this._hasPadding) {
                // Two cases from here: the size of the Primitive is Auto, its content can't be shrink, so me resize the primitive itself
                if (isSizeAuto) {
                    var content = this.size.clone();
                    this._getActualSizeFromContentToRef(content, Prim2DBase._icArea);
                    this.padding.enlarge(Prim2DBase._icArea, po, Prim2DBase._size);
                    this._contentArea.copyFrom(content);
                    this.actualSize = Prim2DBase._size.clone();
                    // Changing the padding has resize the prim, which forces us to recompute margin again
                    if (this._hasMargin) {
                        this.margin.computeWithAlignment(this.layoutArea, Prim2DBase._size, this.marginAlignment, this._marginOffset, Prim2DBase._size);
                    }
                }
                else {
                    this._getInitialContentAreaToRef(this.actualSize, Prim2DBase._icZone, Prim2DBase._icArea);
                    Prim2DBase._icArea.width = Math.max(0, Prim2DBase._icArea.width);
                    Prim2DBase._icArea.height = Math.max(0, Prim2DBase._icArea.height);
                    this.padding.compute(Prim2DBase._icArea, po, Prim2DBase._size);
                    this._paddingOffset.x = po.x;
                    this._paddingOffset.y = po.y;
                    this._paddingOffset.x += Prim2DBase._icZone.x;
                    this._paddingOffset.y += Prim2DBase._icZone.y;
                    this._paddingOffset.z -= Prim2DBase._icZone.z;
                    this._paddingOffset.w -= Prim2DBase._icZone.w;
                    this._contentArea.copyFrom(Prim2DBase._size);
                }
            }
            else {
                this._getInitialContentAreaToRef(this.actualSize, Prim2DBase._icZone, Prim2DBase._icArea);
                Prim2DBase._icArea.width = Math.max(0, Prim2DBase._icArea.width);
                Prim2DBase._icArea.height = Math.max(0, Prim2DBase._icArea.height);
                this._paddingOffset.x = Prim2DBase._icZone.x;
                this._paddingOffset.y = Prim2DBase._icZone.y;
                this._paddingOffset.z = Prim2DBase._icZone.z;
                this._paddingOffset.w = Prim2DBase._icZone.z;
                this._contentArea.copyFrom(Prim2DBase._icArea);
            }
            if (!this._position) {
                var aPos = new BABYLON.Vector2(this.layoutAreaPos.x + this._marginOffset.x, this.layoutAreaPos.y + this._marginOffset.y);
                this.actualPosition = aPos;
            }
            if (isSizeAuto) {
                this._lastAutoSizeArea = this.actualSize;
            }
            if (this.displayDebugAreas) {
                this._updateDebugArea();
            }
        };
        Object.defineProperty(Prim2DBase.prototype, "contentArea", {
            /**
             * Get the content are of this primitive, this area is computed using the padding property and also possibly the primitive type itself.
             * Children of this primitive will be positioned relative to the bottom/left corner of this area.
             */
            get: function () {
                // Check for positioning update
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty)) {
                    this._updatePositioning();
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagPositioningDirty);
                }
                return this._contentArea;
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype._patchHierarchy = function (owner) {
            this._owner = owner;
            // The only place we initialize the _renderGroup is this method, if it's set, we already been there, no need to execute more
            if (this._renderGroup != null) {
                return;
            }
            if (this instanceof BABYLON.Group2D) {
                var group = this;
                group.detectGroupStates();
                if (group._trackedNode && !group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                    group.owner._registerTrackedNode(this);
                }
            }
            this._renderGroup = this.traverseUp(function (p) { return p instanceof BABYLON.Group2D && p.isRenderableGroup; });
            if (this._parent) {
                this._parentLayoutDirty();
            }
            // Make sure the prim is in the dirtyList if it should be
            if (this._renderGroup && this.isDirty) {
                var list = this._renderGroup._renderableData._primDirtyList;
                var i = list.indexOf(this);
                if (i === -1) {
                    list.push(this);
                }
            }
            // Recurse
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._hierarchyDepth = this._hierarchyDepth + 1;
                child._patchHierarchy(owner);
            }
        };
        Prim2DBase.prototype._updateZOrder = function () {
            var prevLinPos = this._primLinearPosition;
            var startI = 0;
            var startZ = this._zOrder;
            // We must start rebuilding Z-Order from the Prim before the first one that changed, because we know its Z-Order is correct, so are its children, but it's better to recompute everything from this point instead of finding the last valid children
            var childrenCount = this._children.length;
            if (this._firstZDirtyIndex > 0) {
                if ((this._firstZDirtyIndex - 1) < childrenCount) {
                    var prevPrim = this._children[this._firstZDirtyIndex - 1];
                    prevLinPos = prevPrim._primLinearPosition;
                    startI = this._firstZDirtyIndex - 1;
                    startZ = prevPrim._zOrder;
                }
            }
            var startPos = prevLinPos;
            // Update the linear position of the primitive from the first one to the last inside this primitive, compute the total number of prim traversed
            Prim2DBase._totalCount = 0;
            for (var i = startI; i < childrenCount; i++) {
                var child = this._children[i];
                prevLinPos = child._updatePrimitiveLinearPosition(prevLinPos);
            }
            // Compute the new Z-Order for all the primitives
            // Add 20% to the current total count to reserve space for future insertions, except if we're rebuilding due to a zMinDelta reached
            var zDelta = (this._zMax - startZ) / (Prim2DBase._totalCount * (Prim2DBase._zRebuildReentrency ? 1 : 1.2));
            // If the computed delta is less than the smallest allowed by the depth buffer, we rebuild the Z-Order from the very beginning of the primitive's children (that is, the first) to redistribute uniformly the Z.
            if (zDelta < BABYLON.Canvas2D._zMinDelta) {
                // Check for re-entrance, if the flag is true we already attempted a rebuild but couldn't get a better zDelta, go up in the hierarchy to rebuilt one level up, hoping to get this time a decent delta, otherwise, recurse until we got it or when no parent is reached, which would mean the canvas would have more than 16 millions of primitives...
                if (Prim2DBase._zRebuildReentrency) {
                    var p = this._parent;
                    if (p == null) {
                        // Can't find a good Z delta and we're in the canvas, which mean we're dealing with too many objects (which should never happen, but well...)
                        console.log("Can't compute Z-Order for " + this.id + "'s children, zDelta is too small, Z-Order is now in an unstable state");
                        Prim2DBase._zRebuildReentrency = false;
                        return;
                    }
                    p._firstZDirtyIndex = 0;
                    return p._updateZOrder();
                }
                Prim2DBase._zRebuildReentrency = true;
                this._firstZDirtyIndex = 0;
                this._updateZOrder();
                Prim2DBase._zRebuildReentrency = false;
            }
            for (var i = startI; i < childrenCount; i++) {
                var child = this._children[i];
                child._updatePrimitiveZOrder(startPos, startZ, zDelta);
            }
            // Notify the Observers that we found during the Z change (we do it after to avoid any kind of re-entrance)
            for (var _i = 0, _a = Prim2DBase._zOrderChangedNotifList; _i < _a.length; _i++) {
                var p = _a[_i];
                p._actualZOrderChangedObservable.notifyObservers(p.actualZOffset);
            }
            Prim2DBase._zOrderChangedNotifList.splice(0);
            this._firstZDirtyIndex = Prim2DBase._bigInt;
            this._clearFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
        };
        Prim2DBase.prototype._updatePrimitiveLinearPosition = function (prevLinPos) {
            if (this.isManualZOrder) {
                return prevLinPos;
            }
            this._primLinearPosition = ++prevLinPos;
            Prim2DBase._totalCount++;
            // Check for the FlatZOrder, which means the children won't have a dedicated Z-Order but will all share the same (unique) one.
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder)) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    prevLinPos = child._updatePrimitiveLinearPosition(prevLinPos);
                }
            }
            return prevLinPos;
        };
        Prim2DBase.prototype._updatePrimitiveZOrder = function (startPos, startZ, deltaZ) {
            if (this.isManualZOrder) {
                return null;
            }
            var newZ = startZ + ((this._primLinearPosition - startPos) * deltaZ);
            var isFlat = this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
            this._setZOrder(newZ, false);
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                this._firstZDirtyIndex = Prim2DBase._bigInt;
                this._clearFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
            }
            var curZ = newZ;
            // Check for the FlatZOrder, which means the children won't have a dedicated Z-Order but will all share the same (unique) one.
            if (isFlat) {
                if (this._children.length > 0) {
                    //let childrenZOrder = startZ + ((this._children[0]._primLinearPosition - startPos) * deltaZ);
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        child._updatePrimitiveFlatZOrder(this._zOrder);
                    }
                }
            }
            else {
                for (var _b = 0, _c = this._children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    var r = child._updatePrimitiveZOrder(startPos, startZ, deltaZ);
                    if (r != null) {
                        curZ = r;
                    }
                }
            }
            this._zMax = isFlat ? newZ : (curZ + deltaZ);
            return curZ;
        };
        Prim2DBase.prototype._updatePrimitiveFlatZOrder = function (newZ) {
            if (this.isManualZOrder) {
                return;
            }
            this._setZOrder(newZ, false);
            this._zMax = newZ;
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                this._firstZDirtyIndex = Prim2DBase._bigInt;
                this._clearFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
            }
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._updatePrimitiveFlatZOrder(newZ);
            }
        };
        Prim2DBase.prototype._setZOrder = function (newZ, directEmit) {
            if (newZ !== this._zOrder) {
                this._zOrder = newZ;
                this.onPrimBecomesDirty();
                this.onZOrderChanged();
                if (this._actualZOrderChangedObservable && this._actualZOrderChangedObservable.hasObservers()) {
                    if (directEmit) {
                        this._actualZOrderChangedObservable.notifyObservers(newZ);
                    }
                    else {
                        Prim2DBase._zOrderChangedNotifList.push(this);
                    }
                }
            }
        };
        Prim2DBase.prototype._updateRenderMode = function () {
        };
        /**
         * This method is used to alter the contentArea of the Primitive before margin is applied.
         * In most of the case you won't need to override this method, but it can prove some usefulness, check the Rectangle2D class for a concrete application.
         * @param primSize the current size of the primitive
         * @param initialContentPosition the position of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing! x, y, z, w area left, bottom, right, top
         * @param initialContentArea the size of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing!
         */
        Prim2DBase.prototype._getInitialContentAreaToRef = function (primSize, initialContentPosition, initialContentArea) {
            initialContentArea.copyFrom(primSize);
            initialContentPosition.x = initialContentPosition.y = initialContentPosition.z = initialContentPosition.w = 0;
        };
        /**
         * This method is used to calculate the new size of the primitive based on the content which must stay the same
         * Check the Rectangle2D implementation for a concrete application.
         * @param primSize the current size of the primitive
         * @param newPrimSize the new size of the primitive. PLEASE ROUND THE values, we're talking about pixels and fraction of them are not our friends!
         */
        Prim2DBase.prototype._getActualSizeFromContentToRef = function (primSize, newPrimSize) {
            newPrimSize.copyFrom(primSize);
        };
        Prim2DBase.PRIM2DBASE_PROPCOUNT = 24;
        Prim2DBase._bigInt = Math.pow(2, 30);
        Prim2DBase._nullPosition = BABYLON.Vector2.Zero();
        Prim2DBase.boundinbBoxReentrency = false;
        Prim2DBase.nullSize = BABYLON.Size.Zero();
        Prim2DBase._bMax = BABYLON.Vector2.Zero();
        Prim2DBase._tpsBB = new BABYLON.BoundingInfo2D();
        Prim2DBase._isCanvasInit = false;
        Prim2DBase._t0 = new BABYLON.Matrix();
        Prim2DBase._t1 = new BABYLON.Matrix();
        Prim2DBase._t2 = new BABYLON.Matrix();
        Prim2DBase._v0 = BABYLON.Vector2.Zero(); // Must stay with the value 0,0
        Prim2DBase._transMtx = BABYLON.Matrix.Zero();
        Prim2DBase._icPos = BABYLON.Vector2.Zero();
        Prim2DBase._icZone = BABYLON.Vector4.Zero();
        Prim2DBase._icArea = BABYLON.Size.Zero();
        Prim2DBase._size = BABYLON.Size.Zero();
        Prim2DBase._zOrderChangedNotifList = new Array();
        Prim2DBase._zRebuildReentrency = false;
        Prim2DBase._totalCount = 0;
        __decorate([
            BABYLON.instanceLevelProperty(1, function (pi) { return Prim2DBase.actualPositionProperty = pi; }, false, false, true)
        ], Prim2DBase.prototype, "actualPosition", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 1, function (pi) { return Prim2DBase.actualXProperty = pi; }, false, false, true)
        ], Prim2DBase.prototype, "actualX", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 2, function (pi) { return Prim2DBase.actualYProperty = pi; }, false, false, true)
        ], Prim2DBase.prototype, "actualY", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 3, function (pi) { return Prim2DBase.positionProperty = pi; }, false, false, true)
        ], Prim2DBase.prototype, "position", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 4, function (pi) { return Prim2DBase.xProperty = pi; }, false, false, true)
        ], Prim2DBase.prototype, "x", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 5, function (pi) { return Prim2DBase.yProperty = pi; }, false, false, true)
        ], Prim2DBase.prototype, "y", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 6, function (pi) { return Prim2DBase.sizeProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "size", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 7, function (pi) { return Prim2DBase.widthProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "width", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 8, function (pi) { return Prim2DBase.heightProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "height", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 9, function (pi) { return Prim2DBase.rotationProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "rotation", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 10, function (pi) { return Prim2DBase.scaleProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "scale", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 11, function (pi) { return Prim2DBase.actualSizeProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "actualSize", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 12, function (pi) { return Prim2DBase.actualWidthProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "actualWidth", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 13, function (pi) { return Prim2DBase.actualHeightProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "actualHeight", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 14, function (pi) { return Prim2DBase.originProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "origin", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 15, function (pi) { return Prim2DBase.levelVisibleProperty = pi; })
        ], Prim2DBase.prototype, "levelVisible", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 16, function (pi) { return Prim2DBase.isVisibleProperty = pi; })
        ], Prim2DBase.prototype, "isVisible", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 17, function (pi) { return Prim2DBase.zOrderProperty = pi; })
        ], Prim2DBase.prototype, "zOrder", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 18, function (pi) { return Prim2DBase.marginProperty = pi; })
        ], Prim2DBase.prototype, "margin", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 19, function (pi) { return Prim2DBase.paddingProperty = pi; })
        ], Prim2DBase.prototype, "padding", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 20, function (pi) { return Prim2DBase.marginAlignmentProperty = pi; })
        ], Prim2DBase.prototype, "marginAlignment", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 21, function (pi) { return Prim2DBase.opacityProperty = pi; })
        ], Prim2DBase.prototype, "opacity", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 22, function (pi) { return Prim2DBase.scaleXProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "scaleX", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 23, function (pi) { return Prim2DBase.scaleYProperty = pi; }, false, true)
        ], Prim2DBase.prototype, "scaleY", null);
        Prim2DBase = __decorate([
            BABYLON.className("Prim2DBase", "BABYLON")
        ], Prim2DBase);
        return Prim2DBase;
    }(BABYLON.SmartPropertyPrim));
    BABYLON.Prim2DBase = Prim2DBase;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var GroupInstanceInfo = (function () {
        function GroupInstanceInfo(owner, mrc, partCount) {
            this._partCount = partCount;
            this.owner = owner;
            this.modelRenderCache = mrc;
            this.modelRenderCache.addRef();
            this.partIndexFromId = new BABYLON.StringDictionary();
            this._usedShaderCategories = new Array(partCount);
            this._strides = new Array(partCount);
            this._opaqueData = null;
            this._alphaTestData = null;
            this._transparentData = null;
            this.opaqueDirty = this.alphaTestDirty = this.transparentDirty = this.transparentOrderDirty = false;
        }
        GroupInstanceInfo.prototype.dispose = function () {
            if (this._isDisposed) {
                return false;
            }
            if (this.modelRenderCache) {
                this.modelRenderCache.dispose();
                this.modelRenderCache = null;
            }
            var engine = this.owner.owner.engine;
            if (this._opaqueData) {
                this._opaqueData.forEach(function (d) { return d.dispose(engine); });
                this._opaqueData = null;
            }
            if (this._alphaTestData) {
                this._alphaTestData.forEach(function (d) { return d.dispose(engine); });
                this._alphaTestData = null;
            }
            if (this._transparentData) {
                this._transparentData.forEach(function (d) { return d.dispose(engine); });
                this._transparentData = null;
            }
            this.partIndexFromId = null;
            this._isDisposed = true;
            return true;
        };
        Object.defineProperty(GroupInstanceInfo.prototype, "hasOpaqueData", {
            get: function () {
                return this._opaqueData != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "hasAlphaTestData", {
            get: function () {
                return this._alphaTestData != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "hasTransparentData", {
            get: function () {
                return this._transparentData != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "opaqueData", {
            get: function () {
                if (!this._opaqueData) {
                    this._opaqueData = new Array(this._partCount);
                    for (var i = 0; i < this._partCount; i++) {
                        this._opaqueData[i] = new GroupInfoPartData(this._strides[i]);
                    }
                }
                return this._opaqueData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "alphaTestData", {
            get: function () {
                if (!this._alphaTestData) {
                    this._alphaTestData = new Array(this._partCount);
                    for (var i = 0; i < this._partCount; i++) {
                        this._alphaTestData[i] = new GroupInfoPartData(this._strides[i]);
                    }
                }
                return this._alphaTestData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "transparentData", {
            get: function () {
                if (!this._transparentData) {
                    this._transparentData = new Array(this._partCount);
                    for (var i = 0; i < this._partCount; i++) {
                        var zoff = this.modelRenderCache._partData[i]._zBiasOffset;
                        this._transparentData[i] = new TransparentGroupInfoPartData(this._strides[i], zoff);
                    }
                }
                return this._transparentData;
            },
            enumerable: true,
            configurable: true
        });
        GroupInstanceInfo.prototype.sortTransparentData = function () {
            if (!this.transparentOrderDirty) {
                return;
            }
            for (var i = 0; i < this._transparentData.length; i++) {
                var td = this._transparentData[i];
                td._partData.sort();
            }
            this.transparentOrderDirty = false;
        };
        Object.defineProperty(GroupInstanceInfo.prototype, "usedShaderCategories", {
            get: function () {
                return this._usedShaderCategories;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "strides", {
            get: function () {
                return this._strides;
            },
            enumerable: true,
            configurable: true
        });
        return GroupInstanceInfo;
    }());
    BABYLON.GroupInstanceInfo = GroupInstanceInfo;
    var TransparentSegment = (function () {
        function TransparentSegment() {
            this.groupInsanceInfo = null;
            this.startZ = 0;
            this.endZ = 0;
            this.startDataIndex = BABYLON.Prim2DBase._bigInt;
            this.endDataIndex = 0;
            this.partBuffers = null;
        }
        TransparentSegment.prototype.dispose = function (engine) {
            if (this.partBuffers) {
                this.partBuffers.forEach(function (b) { return engine._releaseBuffer(b); });
                this.partBuffers.splice(0);
                this.partBuffers = null;
            }
        };
        return TransparentSegment;
    }());
    BABYLON.TransparentSegment = TransparentSegment;
    var GroupInfoPartData = (function () {
        function GroupInfoPartData(stride) {
            this._partData = null;
            this._partBuffer = null;
            this._partBufferSize = 0;
            this._partData = new BABYLON.DynamicFloatArray(stride / 4, 50);
            this._isDisposed = false;
        }
        GroupInfoPartData.prototype.dispose = function (engine) {
            if (this._isDisposed) {
                return false;
            }
            if (this._partBuffer) {
                engine._releaseBuffer(this._partBuffer);
                this._partBuffer = null;
            }
            this._partData = null;
            this._isDisposed = true;
        };
        return GroupInfoPartData;
    }());
    BABYLON.GroupInfoPartData = GroupInfoPartData;
    var TransparentGroupInfoPartData = (function (_super) {
        __extends(TransparentGroupInfoPartData, _super);
        function TransparentGroupInfoPartData(stride, zoff) {
            _super.call(this, stride);
            this._partData.compareValueOffset = zoff;
            this._partData.sortingAscending = false;
        }
        return TransparentGroupInfoPartData;
    }(GroupInfoPartData));
    BABYLON.TransparentGroupInfoPartData = TransparentGroupInfoPartData;
    var ModelRenderCache = (function () {
        function ModelRenderCache(engine, modelKey) {
            this._engine = engine;
            this._modelKey = modelKey;
            this._nextKey = 1;
            this._refCounter = 1;
            this._partData = null;
        }
        ModelRenderCache.prototype.dispose = function () {
            if (--this._refCounter !== 0) {
                return false;
            }
            // Remove the Model Render Cache from the global dictionary
            var edata = this._engine.getExternalData("__BJSCANVAS2D__");
            if (edata) {
                edata.DisposeModelRenderCache(this);
            }
            return true;
        };
        Object.defineProperty(ModelRenderCache.prototype, "isDisposed", {
            get: function () {
                return this._refCounter <= 0;
            },
            enumerable: true,
            configurable: true
        });
        ModelRenderCache.prototype.addRef = function () {
            return ++this._refCounter;
        };
        Object.defineProperty(ModelRenderCache.prototype, "modelKey", {
            get: function () {
                return this._modelKey;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Render the model instances
         * @param instanceInfo
         * @param context
         * @return must return true is the rendering succeed, false if the rendering couldn't be done (asset's not yet ready, like Effect)
         */
        ModelRenderCache.prototype.render = function (instanceInfo, context) {
            return true;
        };
        ModelRenderCache.prototype.getPartIndexFromId = function (partId) {
            for (var i = 0; i < this._partData.length; i++) {
                if (this._partData[i]._partId === partId) {
                    return i;
                }
            }
            return null;
        };
        ModelRenderCache.prototype.loadInstancingAttributes = function (partId, effect) {
            var i = this.getPartIndexFromId(partId);
            if (i === null) {
                return null;
            }
            var ci = this._partsClassInfo[i];
            var categories = this._partData[i]._partUsedCategories;
            var res = ci.classContent.getInstancingAttributeInfos(effect, categories);
            return res;
        };
        ModelRenderCache.prototype.setupUniforms = function (effect, partIndex, data, elementCount) {
            var pd = this._partData[partIndex];
            var offset = (pd._partDataStride / 4) * elementCount;
            var pci = this._partsClassInfo[partIndex];
            var self = this;
            pci.fullContent.forEach(function (k, v) {
                if (!v.category || pd._partUsedCategories.indexOf(v.category) !== -1) {
                    switch (v.dataType) {
                        case 4 /* float */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                effect.setFloat(v.attributeName, data.buffer[offset + attribOffset]);
                                break;
                            }
                        case 0 /* Vector2 */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                ModelRenderCache.v2.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v2.y = data.buffer[offset + attribOffset + 1];
                                effect.setVector2(v.attributeName, ModelRenderCache.v2);
                                break;
                            }
                        case 5 /* Color3 */:
                        case 1 /* Vector3 */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                ModelRenderCache.v3.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v3.y = data.buffer[offset + attribOffset + 1];
                                ModelRenderCache.v3.z = data.buffer[offset + attribOffset + 2];
                                effect.setVector3(v.attributeName, ModelRenderCache.v3);
                                break;
                            }
                        case 6 /* Color4 */:
                        case 2 /* Vector4 */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                ModelRenderCache.v4.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v4.y = data.buffer[offset + attribOffset + 1];
                                ModelRenderCache.v4.z = data.buffer[offset + attribOffset + 2];
                                ModelRenderCache.v4.w = data.buffer[offset + attribOffset + 3];
                                effect.setVector4(v.attributeName, ModelRenderCache.v4);
                                break;
                            }
                        default:
                    }
                }
            });
        };
        //setupUniformsLocation(effect: Effect, uniforms: string[], partId: number) {
        //    let i = this.getPartIndexFromId(partId);
        //    if (i === null) {
        //        return null;
        //    }
        //    let pci = this._partsClassInfo[i];
        //    pci.fullContent.forEach((k, v) => {
        //        if (uniforms.indexOf(v.attributeName) !== -1) {
        //            v.uniformLocation = effect.getUniform(v.attributeName);
        //        }
        //    });
        //}
        ModelRenderCache.v2 = BABYLON.Vector2.Zero();
        ModelRenderCache.v3 = BABYLON.Vector3.Zero();
        ModelRenderCache.v4 = BABYLON.Vector4.Zero();
        return ModelRenderCache;
    }());
    BABYLON.ModelRenderCache = ModelRenderCache;
    var ModelRenderCachePartData = (function () {
        function ModelRenderCachePartData() {
        }
        return ModelRenderCachePartData;
    }());
    BABYLON.ModelRenderCachePartData = ModelRenderCachePartData;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var InstanceClassInfo = (function () {
        function InstanceClassInfo(base) {
            this._baseInfo = base;
            this._nextOffset = new BABYLON.StringDictionary();
            this._attributes = new Array();
        }
        InstanceClassInfo.prototype.mapProperty = function (propInfo, push) {
            var curOff = this._nextOffset.getOrAdd(InstanceClassInfo._CurCategories, 0);
            propInfo.instanceOffset.add(InstanceClassInfo._CurCategories, this._getBaseOffset(InstanceClassInfo._CurCategories) + curOff);
            //console.log(`[${InstanceClassInfo._CurCategories}] New PropInfo. Category: ${propInfo.category}, Name: ${propInfo.attributeName}, Offset: ${propInfo.instanceOffset.get(InstanceClassInfo._CurCategories)}, Size: ${propInfo.size / 4}`);
            this._nextOffset.set(InstanceClassInfo._CurCategories, curOff + (propInfo.size / 4));
            if (push) {
                this._attributes.push(propInfo);
            }
        };
        InstanceClassInfo.prototype.getInstancingAttributeInfos = function (effect, categories) {
            var catInline = ";" + categories.join(";") + ";";
            var res = new Array();
            var curInfo = this;
            while (curInfo) {
                for (var _i = 0, _a = curInfo._attributes; _i < _a.length; _i++) {
                    var attrib = _a[_i];
                    // Only map if there's no category assigned to the instance data or if there's a category and it's in the given list
                    if (!attrib.category || categories.indexOf(attrib.category) !== -1) {
                        var index = effect.getAttributeLocationByName(attrib.attributeName);
                        var iai = new BABYLON.InstancingAttributeInfo();
                        iai.index = index;
                        iai.attributeSize = attrib.size / 4; // attrib.size is in byte and we need to store in "component" (i.e float is 1, vec3 is 3)
                        iai.offset = attrib.instanceOffset.get(catInline) * 4; // attrib.instanceOffset is in float, iai.offset must be in bytes
                        iai.attributeName = attrib.attributeName;
                        res.push(iai);
                    }
                }
                curInfo = curInfo._baseInfo;
            }
            return res;
        };
        InstanceClassInfo.prototype.getShaderAttributes = function (categories) {
            var res = new Array();
            var curInfo = this;
            while (curInfo) {
                for (var _i = 0, _a = curInfo._attributes; _i < _a.length; _i++) {
                    var attrib = _a[_i];
                    // Only map if there's no category assigned to the instance data or if there's a category and it's in the given list
                    if (!attrib.category || categories.indexOf(attrib.category) !== -1) {
                        res.push(attrib.attributeName);
                    }
                }
                curInfo = curInfo._baseInfo;
            }
            return res;
        };
        InstanceClassInfo.prototype._getBaseOffset = function (categories) {
            var curOffset = 0;
            var curBase = this._baseInfo;
            while (curBase) {
                curOffset += curBase._nextOffset.getOrAdd(categories, 0);
                curBase = curBase._baseInfo;
            }
            return curOffset;
        };
        return InstanceClassInfo;
    }());
    BABYLON.InstanceClassInfo = InstanceClassInfo;
    var InstancePropInfo = (function () {
        function InstancePropInfo() {
            this.instanceOffset = new BABYLON.StringDictionary();
        }
        InstancePropInfo.prototype.setSize = function (val) {
            if (val instanceof BABYLON.Vector2) {
                this.size = 8;
                this.dataType = 0 /* Vector2 */;
                return;
            }
            if (val instanceof BABYLON.Vector3) {
                this.size = 12;
                this.dataType = 1 /* Vector3 */;
                return;
            }
            if (val instanceof BABYLON.Vector4) {
                this.size = 16;
                this.dataType = 2 /* Vector4 */;
                return;
            }
            if (val instanceof BABYLON.Matrix) {
                throw new Error("Matrix type is not supported by WebGL Instance Buffer, you have to use four Vector4 properties instead");
            }
            if (typeof (val) === "number") {
                this.size = 4;
                this.dataType = 4 /* float */;
                return;
            }
            if (val instanceof BABYLON.Color3) {
                this.size = 12;
                this.dataType = 5 /* Color3 */;
                return;
            }
            if (val instanceof BABYLON.Color4) {
                this.size = 16;
                this.dataType = 6 /* Color4 */;
                return;
            }
            if (val instanceof BABYLON.Size) {
                this.size = 8;
                this.dataType = 7 /* Size */;
                return;
            }
            return;
        };
        InstancePropInfo.prototype.writeData = function (array, offset, val) {
            switch (this.dataType) {
                case 0 /* Vector2 */:
                    {
                        var v = val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        break;
                    }
                case 1 /* Vector3 */:
                    {
                        var v = val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        array[offset + 2] = v.z;
                        break;
                    }
                case 2 /* Vector4 */:
                    {
                        var v = val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        array[offset + 2] = v.z;
                        array[offset + 3] = v.w;
                        break;
                    }
                case 5 /* Color3 */:
                    {
                        var v = val;
                        array[offset + 0] = v.r;
                        array[offset + 1] = v.g;
                        array[offset + 2] = v.b;
                        break;
                    }
                case 6 /* Color4 */:
                    {
                        var v = val;
                        array[offset + 0] = v.r;
                        array[offset + 1] = v.g;
                        array[offset + 2] = v.b;
                        array[offset + 3] = v.a;
                        break;
                    }
                case 4 /* float */:
                    {
                        var v = val;
                        array[offset] = v;
                        break;
                    }
                case 3 /* Matrix */:
                    {
                        var v = val;
                        for (var i = 0; i < 16; i++) {
                            array[offset + i] = v.m[i];
                        }
                        break;
                    }
                case 7 /* Size */:
                    {
                        var s = val;
                        array[offset + 0] = s.width;
                        array[offset + 1] = s.height;
                        break;
                    }
            }
        };
        return InstancePropInfo;
    }());
    BABYLON.InstancePropInfo = InstancePropInfo;
    function instanceData(category, shaderAttributeName) {
        return function (target, propName, descriptor) {
            var dic = BABYLON.ClassTreeInfo.getOrRegister(target, function (base) { return new InstanceClassInfo(base); });
            var node = dic.getLevelOf(target);
            var instanceDataName = propName;
            shaderAttributeName = shaderAttributeName || instanceDataName;
            var info = node.levelContent.get(instanceDataName);
            if (info) {
                throw new Error("The ID " + instanceDataName + " is already taken by another instance data");
            }
            info = new InstancePropInfo();
            info.attributeName = shaderAttributeName;
            info.category = category || null;
            if (info.category) {
                info.delimitedCategory = ";" + info.category + ";";
            }
            node.levelContent.add(instanceDataName, info);
            descriptor.get = function () {
                return null;
            };
            descriptor.set = function (val) {
                // Check that we're not trying to set a property that belongs to a category that is not allowed (current)
                // Quit if it's the case, otherwise we could overwrite data somewhere...
                if (info.category && InstanceClassInfo._CurCategories.indexOf(info.delimitedCategory) === -1) {
                    return;
                }
                if (!info.size) {
                    info.setSize(val);
                    node.classContent.mapProperty(info, true);
                }
                else if (!info.instanceOffset.contains(InstanceClassInfo._CurCategories)) {
                    node.classContent.mapProperty(info, false);
                }
                var obj = this;
                if (obj.dataBuffer && obj.dataElements) {
                    var offset = obj.dataElements[obj.curElement].offset + info.instanceOffset.get(InstanceClassInfo._CurCategories);
                    info.writeData(obj.dataBuffer.buffer, offset, val);
                }
            };
        };
    }
    BABYLON.instanceData = instanceData;
    var InstanceDataBase = (function () {
        function InstanceDataBase(partId, dataElementCount) {
            this.id = partId;
            this.curElement = 0;
            this._dataElementCount = dataElementCount;
            this.renderMode = 0;
            this.arrayLengthChanged = false;
        }
        Object.defineProperty(InstanceDataBase.prototype, "zBias", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstanceDataBase.prototype, "transformX", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstanceDataBase.prototype, "transformY", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstanceDataBase.prototype, "opacity", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        InstanceDataBase.prototype.getClassTreeInfo = function () {
            if (!this.typeInfo) {
                this.typeInfo = BABYLON.ClassTreeInfo.get(Object.getPrototypeOf(this));
            }
            return this.typeInfo;
        };
        InstanceDataBase.prototype.allocElements = function () {
            if (!this.dataBuffer || this.dataElements) {
                return;
            }
            var res = new Array(this.dataElementCount);
            for (var i = 0; i < this.dataElementCount; i++) {
                res[i] = this.dataBuffer.allocElement();
            }
            this.dataElements = res;
        };
        InstanceDataBase.prototype.freeElements = function () {
            if (!this.dataElements) {
                return;
            }
            for (var _i = 0, _a = this.dataElements; _i < _a.length; _i++) {
                var ei = _a[_i];
                this.dataBuffer.freeElement(ei);
            }
            this.dataElements = null;
        };
        Object.defineProperty(InstanceDataBase.prototype, "dataElementCount", {
            get: function () {
                return this._dataElementCount;
            },
            set: function (value) {
                if (value === this._dataElementCount) {
                    return;
                }
                this.arrayLengthChanged = true;
                this.freeElements();
                this._dataElementCount = value;
                this.allocElements();
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            instanceData()
        ], InstanceDataBase.prototype, "zBias", null);
        __decorate([
            instanceData()
        ], InstanceDataBase.prototype, "transformX", null);
        __decorate([
            instanceData()
        ], InstanceDataBase.prototype, "transformY", null);
        __decorate([
            instanceData()
        ], InstanceDataBase.prototype, "opacity", null);
        return InstanceDataBase;
    }());
    BABYLON.InstanceDataBase = InstanceDataBase;
    var RenderablePrim2D = (function (_super) {
        __extends(RenderablePrim2D, _super);
        function RenderablePrim2D(settings) {
            _super.call(this, settings);
            this._transparentPrimitiveInfo = null;
        }
        Object.defineProperty(RenderablePrim2D.prototype, "isAlphaTest", {
            get: function () {
                return this._useTextureAlpha() || this._isPrimAlphaTest();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderablePrim2D.prototype, "isTransparent", {
            get: function () {
                return (this.actualOpacity < 1) || this._shouldUseAlphaFromTexture() || this._isPrimTransparent();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderablePrim2D.prototype, "renderMode", {
            get: function () {
                return this._renderMode;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Dispose the primitive and its resources, remove it from its parent
         */
        RenderablePrim2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.renderGroup) {
                this.renderGroup._setCacheGroupDirty();
            }
            if (this._transparentPrimitiveInfo) {
                this.renderGroup._renderableData.removeTransparentPrimitiveInfo(this._transparentPrimitiveInfo);
                this._transparentPrimitiveInfo = null;
            }
            if (this._instanceDataParts) {
                this._cleanupInstanceDataParts();
            }
            if (this._modelRenderCache) {
                this._modelRenderCache.dispose();
                this._modelRenderCache = null;
            }
            if (this._instanceDataParts) {
                this._instanceDataParts.forEach(function (p) {
                    p.freeElements();
                });
                this._instanceDataParts = null;
            }
            return true;
        };
        RenderablePrim2D.prototype._cleanupInstanceDataParts = function () {
            var gii = null;
            for (var _i = 0, _a = this._instanceDataParts; _i < _a.length; _i++) {
                var part = _a[_i];
                part.freeElements();
                gii = part.groupInstanceInfo;
            }
            if (gii) {
                var usedCount = 0;
                if (gii.hasOpaqueData) {
                    var od = gii.opaqueData[0];
                    usedCount += od._partData.usedElementCount;
                    gii.opaqueDirty = true;
                }
                if (gii.hasAlphaTestData) {
                    var atd = gii.alphaTestData[0];
                    usedCount += atd._partData.usedElementCount;
                    gii.alphaTestDirty = true;
                }
                if (gii.hasTransparentData) {
                    var td = gii.transparentData[0];
                    usedCount += td._partData.usedElementCount;
                    gii.transparentDirty = true;
                }
                if (usedCount === 0 && gii.modelRenderCache != null) {
                    this.renderGroup._renderableData._renderGroupInstancesInfo.remove(gii.modelRenderCache.modelKey);
                    gii.dispose();
                }
                if (this._modelRenderCache) {
                    this._modelRenderCache.dispose();
                    this._modelRenderCache = null;
                }
            }
            this._instanceDataParts = null;
        };
        RenderablePrim2D.prototype._prepareRenderPre = function (context) {
            _super.prototype._prepareRenderPre.call(this, context);
            // If the model changed and we have already an instance, we must remove this instance from the obsolete model
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagModelDirty) && this._instanceDataParts) {
                this._cleanupInstanceDataParts();
            }
            // Need to create the model?
            var setupModelRenderCache = false;
            if (!this._modelRenderCache || this._isFlagSet(BABYLON.SmartPropertyPrim.flagModelDirty)) {
                setupModelRenderCache = this._createModelRenderCache();
            }
            var gii = null;
            var newInstance = false;
            // Need to create the instance data parts?
            if (!this._instanceDataParts) {
                // Yes, flag it for later, more processing will have to be done
                newInstance = true;
                gii = this._createModelDataParts();
            }
            // If the ModelRenderCache is brand new, now is the time to call the implementation's specific setup method to create the rendering resources
            if (setupModelRenderCache) {
                this.setupModelRenderCache(this._modelRenderCache);
            }
            // At this stage we have everything correctly initialized, ModelRenderCache is setup, Model Instance data are good too, they have allocated elements in the Instanced DynamicFloatArray.
            // The last thing to do is check if the instanced related data must be updated because a InstanceLevel property had changed or the primitive visibility changed.
            if (this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagVisibilityChanged | BABYLON.SmartPropertyPrim.flagNeedRefresh) || context.forceRefreshPrimitive || newInstance || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep) || this._mustUpdateInstance()) {
                this._updateInstanceDataParts(gii);
            }
        };
        RenderablePrim2D.prototype._createModelRenderCache = function () {
            var _this = this;
            var setupModelRenderCache = false;
            if (this._modelRenderCache) {
                this._modelRenderCache.dispose();
            }
            this._modelRenderCache = this.owner._engineData.GetOrAddModelCache(this.modelKey, function (key) {
                var mrc = _this.createModelRenderCache(key);
                setupModelRenderCache = true;
                return mrc;
            });
            this._clearFlags(BABYLON.SmartPropertyPrim.flagModelDirty);
            // if this is still false it means the MRC already exists, so we add a reference to it
            if (!setupModelRenderCache) {
                this._modelRenderCache.addRef();
            }
            return setupModelRenderCache;
        };
        RenderablePrim2D.prototype._createModelDataParts = function () {
            var _this = this;
            // Create the instance data parts of the primitive and store them
            var parts = this.createInstanceDataParts();
            this._instanceDataParts = parts;
            // Check if the ModelRenderCache for this particular instance is also brand new, initialize it if it's the case
            if (!this._modelRenderCache._partData) {
                this._setupModelRenderCache(parts);
            }
            // The Rendering resources (Effect, VB, IB, Textures) are stored in the ModelRenderCache
            // But it's the RenderGroup that will store all the Instanced related data to render all the primitive it owns.
            // So for a given ModelKey we getOrAdd a GroupInstanceInfo that will store all these data
            var gii = this.renderGroup._renderableData._renderGroupInstancesInfo.getOrAddWithFactory(this.modelKey, function (k) {
                var res = new BABYLON.GroupInstanceInfo(_this.renderGroup, _this._modelRenderCache, _this._modelRenderCache._partData.length);
                for (var j = 0; j < _this._modelRenderCache._partData.length; j++) {
                    var part = _this._instanceDataParts[j];
                    res.partIndexFromId.add(part.id.toString(), j);
                    res.usedShaderCategories[j] = ";" + _this.getUsedShaderCategories(part).join(";") + ";";
                    res.strides[j] = _this._modelRenderCache._partData[j]._partDataStride;
                }
                return res;
            });
            // Get the GroupInfoDataPart corresponding to the render category of the part
            var rm = 0;
            var gipd = null;
            if (this.isTransparent) {
                gipd = gii.transparentData;
                rm = BABYLON.Render2DContext.RenderModeTransparent;
            }
            else if (this.isAlphaTest) {
                gipd = gii.alphaTestData;
                rm = BABYLON.Render2DContext.RenderModeAlphaTest;
            }
            else {
                gipd = gii.opaqueData;
                rm = BABYLON.Render2DContext.RenderModeOpaque;
            }
            // For each instance data part of the primitive, allocate the instanced element it needs for render
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                part.dataBuffer = gipd[i]._partData;
                part.allocElements();
                part.renderMode = rm;
                part.groupInstanceInfo = gii;
            }
            return gii;
        };
        RenderablePrim2D.prototype._setupModelRenderCache = function (parts) {
            var ctiArray = new Array();
            this._modelRenderCache._partData = new Array();
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var dataPart = parts_1[_i];
                var pd = new BABYLON.ModelRenderCachePartData();
                this._modelRenderCache._partData.push(pd);
                var cat = this.getUsedShaderCategories(dataPart);
                var cti = dataPart.getClassTreeInfo();
                // Make sure the instance is visible other the properties won't be set and their size/offset wont be computed
                var curVisible = this.isVisible;
                this.isVisible = true;
                // We manually trigger refreshInstanceData for the only sake of evaluating each instance property size and offset in the instance data, this can only be made at runtime. Once it's done we have all the information to create the instance data buffer.
                //console.log("Build Prop Layout for " + Tools.getClassName(this._instanceDataParts[0]));
                var joinCat = ";" + cat.join(";") + ";";
                pd._partJoinedUsedCategories = joinCat;
                InstanceClassInfo._CurCategories = joinCat;
                var obj = this.beforeRefreshForLayoutConstruction(dataPart);
                if (!this.refreshInstanceDataPart(dataPart)) {
                    console.log("Layout construction for " + BABYLON.Tools.getClassName(this._instanceDataParts[0]) + " failed because refresh returned false");
                }
                this.afterRefreshForLayoutConstruction(dataPart, obj);
                this.isVisible = curVisible;
                var size = 0;
                cti.fullContent.forEach(function (k, v) {
                    if (!v.category || cat.indexOf(v.category) !== -1) {
                        if (v.attributeName === "zBias") {
                            pd._zBiasOffset = v.instanceOffset.get(joinCat);
                        }
                        if (!v.size) {
                            console.log("ERROR: Couldn't detect the size of the Property " + v.attributeName + " from type " + BABYLON.Tools.getClassName(cti.type) + ". Property is ignored.");
                        }
                        else {
                            size += v.size;
                        }
                    }
                });
                pd._partDataStride = size;
                pd._partUsedCategories = cat;
                pd._partId = dataPart.id;
                ctiArray.push(cti);
            }
            this._modelRenderCache._partsClassInfo = ctiArray;
        };
        RenderablePrim2D.prototype.onZOrderChanged = function () {
            if (this.isTransparent && this._transparentPrimitiveInfo) {
                this.renderGroup._renderableData.transparentPrimitiveZChanged(this._transparentPrimitiveInfo);
                var gii = this.renderGroup._renderableData._renderGroupInstancesInfo.get(this.modelKey);
                // Flag the transparentData dirty has will have to sort it again
                gii.transparentOrderDirty = true;
            }
        };
        RenderablePrim2D.prototype._mustUpdateInstance = function () {
            return false;
        };
        RenderablePrim2D.prototype._useTextureAlpha = function () {
            return false;
        };
        RenderablePrim2D.prototype._shouldUseAlphaFromTexture = function () {
            return false;
        };
        RenderablePrim2D.prototype._isPrimAlphaTest = function () {
            return false;
        };
        RenderablePrim2D.prototype._isPrimTransparent = function () {
            return false;
        };
        RenderablePrim2D.prototype._updateInstanceDataParts = function (gii) {
            // Fetch the GroupInstanceInfo if we don't already have it
            var rd = this.renderGroup._renderableData;
            if (!gii) {
                gii = rd._renderGroupInstancesInfo.get(this.modelKey);
            }
            var isTransparent = this.isTransparent;
            var isAlphaTest = this.isAlphaTest;
            var wereTransparent = false;
            // Check a render mode change
            var rmChanged = false;
            if (this._instanceDataParts.length > 0) {
                var firstPart = this._instanceDataParts[0];
                var partRM = firstPart.renderMode;
                var curRM = this.renderMode;
                if (partRM !== curRM) {
                    wereTransparent = partRM === BABYLON.Render2DContext.RenderModeTransparent;
                    rmChanged = true;
                    var gipd = void 0;
                    switch (curRM) {
                        case BABYLON.Render2DContext.RenderModeTransparent:
                            gipd = gii.transparentData;
                            break;
                        case BABYLON.Render2DContext.RenderModeAlphaTest:
                            gipd = gii.alphaTestData;
                            break;
                        default:
                            gipd = gii.opaqueData;
                    }
                    for (var i = 0; i < this._instanceDataParts.length; i++) {
                        var part = this._instanceDataParts[i];
                        part.freeElements();
                        part.dataBuffer = gipd[i]._partData;
                        part.renderMode = curRM;
                    }
                }
            }
            // Handle changes related to ZOffset
            var visChanged = this._isFlagSet(BABYLON.SmartPropertyPrim.flagVisibilityChanged);
            if (isTransparent || wereTransparent) {
                // Handle visibility change, which is also triggered when the primitive just got created
                if (visChanged || rmChanged) {
                    if (this.isVisible && !wereTransparent) {
                        if (!this._transparentPrimitiveInfo) {
                            // Add the primitive to the list of transparent ones in the group that render is
                            this._transparentPrimitiveInfo = rd.addNewTransparentPrimitiveInfo(this, gii);
                        }
                    }
                    else {
                        if (this._transparentPrimitiveInfo) {
                            rd.removeTransparentPrimitiveInfo(this._transparentPrimitiveInfo);
                            this._transparentPrimitiveInfo = null;
                        }
                    }
                    gii.transparentOrderDirty = true;
                }
            }
            var rebuildTrans = false;
            // For each Instance Data part, refresh it to update the data in the DynamicFloatArray
            for (var _i = 0, _a = this._instanceDataParts; _i < _a.length; _i++) {
                var part = _a[_i];
                var justAllocated = false;
                // Check if we need to allocate data elements (hidden prim which becomes visible again)
                if (!part.dataElements && (visChanged || rmChanged || this.isVisible)) {
                    part.allocElements();
                    justAllocated = true;
                }
                InstanceClassInfo._CurCategories = gii.usedShaderCategories[gii.partIndexFromId.get(part.id.toString())];
                // Will return false if the instance should not be rendered (not visible or other any reasons)
                part.arrayLengthChanged = false;
                if (!this.refreshInstanceDataPart(part)) {
                    // Free the data element
                    if (part.dataElements) {
                        part.freeElements();
                    }
                    // The refresh couldn't succeed, push the primitive to be dirty again for the next render
                    if (this.isVisible) {
                        rd._primNewDirtyList.push(this);
                    }
                }
                rebuildTrans = rebuildTrans || part.arrayLengthChanged || justAllocated;
            }
            this._instanceDirtyFlags = 0;
            // Make the appropriate data dirty
            if (isTransparent) {
                gii.transparentDirty = true;
                if (rebuildTrans) {
                    rd._transparentListChanged = true;
                }
            }
            else if (isAlphaTest) {
                gii.alphaTestDirty = true;
            }
            else {
                gii.opaqueDirty = true;
            }
            this._clearFlags(BABYLON.SmartPropertyPrim.flagVisibilityChanged); // Reset the flag as we've handled the case            
        };
        RenderablePrim2D.prototype._updateTransparentSegmentIndices = function (ts) {
            var minOff = BABYLON.Prim2DBase._bigInt;
            var maxOff = 0;
            for (var _i = 0, _a = this._instanceDataParts; _i < _a.length; _i++) {
                var part = _a[_i];
                if (part && part.dataElements) {
                    part.dataBuffer.pack();
                    for (var _b = 0, _c = part.dataElements; _b < _c.length; _b++) {
                        var el = _c[_b];
                        minOff = Math.min(minOff, el.offset);
                        maxOff = Math.max(maxOff, el.offset);
                    }
                    ts.startDataIndex = Math.min(ts.startDataIndex, minOff / part.dataBuffer.stride);
                    ts.endDataIndex = Math.max(ts.endDataIndex, (maxOff / part.dataBuffer.stride) + 1); // +1 for exclusive
                }
            }
        };
        // This internal method is mainly used for transparency processing
        RenderablePrim2D.prototype._getNextPrimZOrder = function () {
            var length = this._instanceDataParts.length;
            for (var i = 0; i < length; i++) {
                var part = this._instanceDataParts[i];
                if (part) {
                    var stride = part.dataBuffer.stride;
                    var lastElementOffset = part.dataElements[part.dataElements.length - 1].offset;
                    // check if it's the last in the DFA
                    if (part.dataBuffer.totalElementCount * stride <= lastElementOffset) {
                        return null;
                    }
                    // Return the Z of the next primitive that lies in the DFA
                    return part.dataBuffer[lastElementOffset + stride + this.modelRenderCache._partData[i]._zBiasOffset];
                }
            }
            return null;
        };
        // This internal method is mainly used for transparency processing
        RenderablePrim2D.prototype._getPrevPrimZOrder = function () {
            var length = this._instanceDataParts.length;
            for (var i = 0; i < length; i++) {
                var part = this._instanceDataParts[i];
                if (part) {
                    var stride = part.dataBuffer.stride;
                    var firstElementOffset = part.dataElements[0].offset;
                    // check if it's the first in the DFA
                    if (firstElementOffset === 0) {
                        return null;
                    }
                    // Return the Z of the previous primitive that lies in the DFA
                    return part.dataBuffer[firstElementOffset - stride + this.modelRenderCache._partData[i]._zBiasOffset];
                }
            }
            return null;
        };
        /**
         * Transform a given point using the Primitive's origin setting.
         * This method requires the Primitive's actualSize to be accurate
         * @param p the point to transform
         * @param originOffset an offset applied on the current origin before performing the transformation. Depending on which frame of reference your data is expressed you may have to apply a offset. (if you data is expressed from the bottom/left, no offset is required. If it's expressed from the center the a [-0.5;-0.5] offset has to be applied.
         * @param res an allocated Vector2 that will receive the transformed content
         */
        RenderablePrim2D.prototype.transformPointWithOriginByRef = function (p, originOffset, res) {
            var actualSize = this.actualSize;
            res.x = p.x - ((this.origin.x + (originOffset ? originOffset.x : 0)) * actualSize.width);
            res.y = p.y - ((this.origin.y + (originOffset ? originOffset.y : 0)) * actualSize.height);
        };
        RenderablePrim2D.prototype.transformPointWithOriginToRef = function (p, originOffset, res) {
            this.transformPointWithOriginByRef(p, originOffset, res);
            return res;
        };
        /**
         * Get the info for a given effect based on the dataPart metadata
         * @param dataPartId partId in part list to get the info
         * @param vertexBufferAttributes vertex buffer attributes to manually add
         * @param uniforms uniforms to manually add
         * @param useInstanced specified if Instanced Array should be used, if null the engine caps will be used (so true if WebGL supports it, false otherwise), but you have the possibility to override the engine capability. However, if you manually set true but the engine does not support Instanced Array, this method will return null
         */
        RenderablePrim2D.prototype.getDataPartEffectInfo = function (dataPartId, vertexBufferAttributes, uniforms, useInstanced) {
            if (uniforms === void 0) { uniforms = null; }
            if (useInstanced === void 0) { useInstanced = null; }
            var dataPart = BABYLON.Tools.first(this._instanceDataParts, function (i) { return i.id === dataPartId; });
            if (!dataPart) {
                return null;
            }
            var instancedArray = this.owner.supportInstancedArray;
            if (useInstanced != null) {
                // Check if the caller ask for Instanced Array and the engine does not support it, return null if it's the case
                if (useInstanced && instancedArray === false) {
                    return null;
                }
                // Use the caller's setting
                instancedArray = useInstanced;
            }
            var cti = dataPart.getClassTreeInfo();
            var categories = this.getUsedShaderCategories(dataPart);
            var att = cti.classContent.getShaderAttributes(categories);
            var defines = "";
            categories.forEach(function (c) { defines += "#define " + c + "\n"; });
            if (instancedArray) {
                defines += "#define Instanced\n";
            }
            return {
                attributes: instancedArray ? vertexBufferAttributes.concat(att) : vertexBufferAttributes,
                uniforms: instancedArray ? (uniforms != null ? uniforms : []) : ((uniforms != null) ? att.concat(uniforms) : (att != null ? att : [])),
                defines: defines
            };
        };
        Object.defineProperty(RenderablePrim2D.prototype, "modelRenderCache", {
            get: function () {
                return this._modelRenderCache;
            },
            enumerable: true,
            configurable: true
        });
        RenderablePrim2D.prototype.createModelRenderCache = function (modelKey) {
            return null;
        };
        RenderablePrim2D.prototype.setupModelRenderCache = function (modelRenderCache) {
        };
        RenderablePrim2D.prototype.createInstanceDataParts = function () {
            return null;
        };
        RenderablePrim2D.prototype.getUsedShaderCategories = function (dataPart) {
            return [];
        };
        RenderablePrim2D.prototype.beforeRefreshForLayoutConstruction = function (part) {
        };
        RenderablePrim2D.prototype.afterRefreshForLayoutConstruction = function (part, obj) {
        };
        RenderablePrim2D.prototype.applyActualScaleOnTransform = function () {
            return true;
        };
        RenderablePrim2D.prototype.refreshInstanceDataPart = function (part) {
            if (!this.isVisible) {
                return false;
            }
            part.isVisible = this.isVisible;
            // Which means, if there's only one data element, we're update it from this method, otherwise it is the responsibility of the derived class to call updateInstanceDataPart as many times as needed, properly (look at Text2D's implementation for more information)
            if (part.dataElementCount === 1) {
                part.curElement = 0;
                this.updateInstanceDataPart(part);
            }
            return true;
        };
        /**
         * Update the instanceDataBase level properties of a part
         * @param part the part to update
         * @param positionOffset to use in multi part per primitive (e.g. the Text2D has N parts for N letter to display), this give the offset to apply (e.g. the position of the letter from the bottom/left corner of the text).
         */
        RenderablePrim2D.prototype.updateInstanceDataPart = function (part, positionOffset) {
            if (positionOffset === void 0) { positionOffset = null; }
            var t = this._globalTransform.multiply(this.renderGroup.invGlobalTransform); // Compute the transformation into the renderGroup's space
            var rgScale = this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagDontInheritParentScale) ? RenderablePrim2D._uV : this.renderGroup.actualScale; // We still need to apply the scale of the renderGroup to our rendering, so get it.
            var size = this.renderGroup.viewportSize;
            var zBias = this.actualZOffset;
            var offX = 0;
            var offY = 0;
            // If there's an offset, apply the global transformation matrix on it to get a global offset
            if (positionOffset) {
                offX = positionOffset.x * t.m[0] + positionOffset.y * t.m[4];
                offY = positionOffset.x * t.m[1] + positionOffset.y * t.m[5];
            }
            // Have to convert the coordinates to clip space which is ranged between [-1;1] on X and Y axis, with 0,0 being the left/bottom corner
            // Current coordinates are expressed in renderGroup coordinates ([0, renderGroup.actualSize.width|height]) with 0,0 being at the left/top corner
            // So for X: 
            //  - tx.x = value * 2 / width: is to switch from [0, renderGroup.width] to [0, 2]
            //  - tx.w = (value * 2 / width) - 1: w stores the translation in renderGroup coordinates so (value * 2 / width) to switch to a clip space translation value. - 1 is to offset the overall [0;2] to [-1;1].
            // At last we don't forget to apply the actualScale of the Render Group to tx[0] and ty[1] to propagate scaling correctly
            var w = size.width;
            var h = size.height;
            var invZBias = 1 / zBias;
            var tx = new BABYLON.Vector4(t.m[0] * rgScale.x * 2 / w, t.m[4] * 2 / w, 0 /*t.m[8]*/, ((t.m[12] + offX) * rgScale.x * 2 / w) - 1);
            var ty = new BABYLON.Vector4(t.m[1] * 2 / h, t.m[5] * rgScale.y * 2 / h, 0 /*t.m[9]*/, ((t.m[13] + offY) * rgScale.y * 2 / h) - 1);
            if (!this.applyActualScaleOnTransform()) {
                var las = this.actualScale;
                tx.x /= las.x;
                ty.y /= las.y;
            }
            part.transformX = tx;
            part.transformY = ty;
            part.opacity = this.actualOpacity;
            // Stores zBias and it's inverse value because that's needed to compute the clip space W coordinate (which is 1/Z, so 1/zBias)
            part.zBias = new BABYLON.Vector2(zBias, invZBias);
        };
        RenderablePrim2D.prototype._updateRenderMode = function () {
            if (this.isTransparent) {
                this._renderMode = BABYLON.Render2DContext.RenderModeTransparent;
            }
            else if (this.isAlphaTest) {
                this._renderMode = BABYLON.Render2DContext.RenderModeAlphaTest;
            }
            else {
                this._renderMode = BABYLON.Render2DContext.RenderModeOpaque;
            }
        };
        RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT = BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;
        RenderablePrim2D._uV = new BABYLON.Vector2(1, 1);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 0, function (pi) { return RenderablePrim2D.isAlphaTestProperty = pi; })
        ], RenderablePrim2D.prototype, "isAlphaTest", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, function (pi) { return RenderablePrim2D.isTransparentProperty = pi; })
        ], RenderablePrim2D.prototype, "isTransparent", null);
        RenderablePrim2D = __decorate([
            BABYLON.className("RenderablePrim2D", "BABYLON")
        ], RenderablePrim2D);
        return RenderablePrim2D;
    }(BABYLON.Prim2DBase));
    BABYLON.RenderablePrim2D = RenderablePrim2D;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Shape2D = (function (_super) {
        __extends(Shape2D, _super);
        function Shape2D(settings) {
            _super.call(this, settings);
            if (!settings) {
                settings = {};
            }
            var borderBrush = null;
            if (settings.border) {
                if (typeof (settings.border) === "string") {
                    borderBrush = BABYLON.Canvas2D.GetBrushFromString(settings.border);
                }
                else {
                    borderBrush = settings.border;
                }
            }
            var fillBrush = null;
            if (settings.fill) {
                if (typeof (settings.fill) === "string") {
                    fillBrush = BABYLON.Canvas2D.GetBrushFromString(settings.fill);
                }
                else {
                    fillBrush = settings.fill;
                }
            }
            this._isTransparent = false;
            this._oldTransparent = false;
            this.border = borderBrush;
            this.fill = fillBrush;
            this._updateTransparencyStatus();
            this.borderThickness = settings.borderThickness;
        }
        Object.defineProperty(Shape2D.prototype, "border", {
            get: function () {
                return this._border;
            },
            set: function (value) {
                this._border = value;
                this._updateTransparencyStatus();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2D.prototype, "fill", {
            /**
             * Get/set the brush to render the Fill part of the Primitive
             */
            get: function () {
                return this._fill;
            },
            set: function (value) {
                this._fill = value;
                this._updateTransparencyStatus();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2D.prototype, "borderThickness", {
            get: function () {
                return this._borderThickness;
            },
            set: function (value) {
                this._borderThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Shape2D.prototype.getUsedShaderCategories = function (dataPart) {
            var cat = _super.prototype.getUsedShaderCategories.call(this, dataPart);
            // Fill Part
            if (dataPart.id === Shape2D.SHAPE2D_FILLPARTID) {
                var fill = this.fill;
                if (fill instanceof BABYLON.SolidColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_FILLSOLID);
                }
                if (fill instanceof BABYLON.GradientColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT);
                }
            }
            // Border Part
            if (dataPart.id === Shape2D.SHAPE2D_BORDERPARTID) {
                cat.push(Shape2D.SHAPE2D_CATEGORY_BORDER);
                var border = this.border;
                if (border instanceof BABYLON.SolidColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_BORDERSOLID);
                }
                if (border instanceof BABYLON.GradientColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT);
                }
            }
            return cat;
        };
        Shape2D.prototype.applyActualScaleOnTransform = function () {
            return false;
        };
        Shape2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            // Fill Part
            if (part.id === Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                if (this.fill) {
                    var fill = this.fill;
                    if (fill instanceof BABYLON.SolidColorBrush2D) {
                        d.fillSolidColor = fill.color;
                    }
                    else if (fill instanceof BABYLON.GradientColorBrush2D) {
                        d.fillGradientColor1 = fill.color1;
                        d.fillGradientColor2 = fill.color2;
                        var t = BABYLON.Matrix.Compose(new BABYLON.Vector3(fill.scale, fill.scale, fill.scale), BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 1), fill.rotation), new BABYLON.Vector3(fill.translation.x, fill.translation.y, 0));
                        var ty = new BABYLON.Vector4(t.m[1], t.m[5], t.m[9], t.m[13]);
                        d.fillGradientTY = ty;
                    }
                }
            }
            else if (part.id === Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                if (this.border) {
                    d.borderThickness = this.borderThickness;
                    var border = this.border;
                    if (border instanceof BABYLON.SolidColorBrush2D) {
                        d.borderSolidColor = border.color;
                    }
                    else if (border instanceof BABYLON.GradientColorBrush2D) {
                        d.borderGradientColor1 = border.color1;
                        d.borderGradientColor2 = border.color2;
                        var t = BABYLON.Matrix.Compose(new BABYLON.Vector3(border.scale, border.scale, border.scale), BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 1), border.rotation), new BABYLON.Vector3(border.translation.x, border.translation.y, 0));
                        var ty = new BABYLON.Vector4(t.m[1], t.m[5], t.m[9], t.m[13]);
                        d.borderGradientTY = ty;
                    }
                }
            }
            return true;
        };
        Shape2D.prototype._updateTransparencyStatus = function () {
            this._isTransparent = (this._border && this._border.isTransparent()) || (this._fill && this._fill.isTransparent()) || (this.actualOpacity < 1);
            if (this._isTransparent !== this._oldTransparent) {
                this._oldTransparent = this._isTransparent;
                this._updateRenderMode();
            }
        };
        Shape2D.prototype._mustUpdateInstance = function () {
            var res = this._oldTransparent !== this._isTransparent;
            if (res) {
                this._updateRenderMode();
                this._oldTransparent = this._isTransparent;
            }
            return res;
        };
        Shape2D.prototype._isPrimTransparent = function () {
            return this._isTransparent;
        };
        Shape2D.SHAPE2D_BORDERPARTID = 1;
        Shape2D.SHAPE2D_FILLPARTID = 2;
        Shape2D.SHAPE2D_CATEGORY_BORDER = "Border";
        Shape2D.SHAPE2D_CATEGORY_BORDERSOLID = "BorderSolid";
        Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT = "BorderGradient";
        Shape2D.SHAPE2D_CATEGORY_FILLSOLID = "FillSolid";
        Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT = "FillGradient";
        Shape2D.SHAPE2D_PROPCOUNT = BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5;
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Shape2D.borderProperty = pi; }, true)
        ], Shape2D.prototype, "border", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Shape2D.fillProperty = pi; }, true)
        ], Shape2D.prototype, "fill", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, function (pi) { return Shape2D.borderThicknessProperty = pi; })
        ], Shape2D.prototype, "borderThickness", null);
        Shape2D = __decorate([
            BABYLON.className("Shape2D", "BABYLON")
        ], Shape2D);
        return Shape2D;
    }(BABYLON.RenderablePrim2D));
    BABYLON.Shape2D = Shape2D;
    var Shape2DInstanceData = (function (_super) {
        __extends(Shape2DInstanceData, _super);
        function Shape2DInstanceData() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Shape2DInstanceData.prototype, "fillSolidColor", {
            // FILL ATTRIBUTES
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "fillGradientColor1", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "fillGradientColor2", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "fillGradientTY", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderThickness", {
            // BORDER ATTRIBUTES
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderSolidColor", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderGradientColor1", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderGradientColor2", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderGradientTY", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_FILLSOLID)
        ], Shape2DInstanceData.prototype, "fillSolidColor", null);
        __decorate([
            BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        ], Shape2DInstanceData.prototype, "fillGradientColor1", null);
        __decorate([
            BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        ], Shape2DInstanceData.prototype, "fillGradientColor2", null);
        __decorate([
            BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        ], Shape2DInstanceData.prototype, "fillGradientTY", null);
        __decorate([
            BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDER)
        ], Shape2DInstanceData.prototype, "borderThickness", null);
        __decorate([
            BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERSOLID)
        ], Shape2DInstanceData.prototype, "borderSolidColor", null);
        __decorate([
            BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT)
        ], Shape2DInstanceData.prototype, "borderGradientColor1", null);
        __decorate([
            BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT)
        ], Shape2DInstanceData.prototype, "borderGradientColor2", null);
        __decorate([
            BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT)
        ], Shape2DInstanceData.prototype, "borderGradientTY", null);
        return Shape2DInstanceData;
    }(BABYLON.InstanceDataBase));
    BABYLON.Shape2DInstanceData = Shape2DInstanceData;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Group2D = (function (_super) {
        __extends(Group2D, _super);
        /**
         * Create an Logical or Renderable Group.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height properties can be set. If null the size will be computed from its content, default is null.
         *  - cacheBehavior: Define how the group should behave regarding the Canvas's cache strategy, default is Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY
         * - layoutEngine: either an instance of a layout engine based class (StackPanel.Vertical, StackPanel.Horizontal) or a string ('canvas' for Canvas layout, 'StackPanel' or 'HorizontalStackPanel' for horizontal Stack Panel layout, 'VerticalStackPanel' for vertical Stack Panel layout).
         * - isVisible: true if the group must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Group2D(settings) {
            if (settings == null) {
                settings = {};
            }
            if (settings.origin == null) {
                settings.origin = new BABYLON.Vector2(0, 0);
            }
            _super.call(this, settings);
            var size = (!settings.size && !settings.width && !settings.height) ? null : (settings.size || (new BABYLON.Size(settings.width || 0, settings.height || 0)));
            this._trackedNode = (settings.trackNode == null) ? null : settings.trackNode;
            if (this._trackedNode && this.owner) {
                this.owner._registerTrackedNode(this);
            }
            this._cacheBehavior = (settings.cacheBehavior == null) ? Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY : settings.cacheBehavior;
            var rd = this._renderableData;
            if (rd) {
                rd._noResizeOnScale = (this.cacheBehavior & Group2D.GROUPCACHEBEHAVIOR_NORESIZEONSCALE) !== 0;
            }
            this.size = size;
            this._viewportPosition = BABYLON.Vector2.Zero();
            this._viewportSize = BABYLON.Size.Zero();
        }
        Group2D._createCachedCanvasGroup = function (owner) {
            var g = new Group2D({ parent: owner, id: "__cachedCanvasGroup__", position: BABYLON.Vector2.Zero(), origin: BABYLON.Vector2.Zero(), size: null, isVisible: true, isPickable: false, dontInheritParentScale: true });
            return g;
        };
        Group2D.prototype.applyCachedTexture = function (vertexData, material) {
            this._bindCacheTarget();
            if (vertexData) {
                var uv = vertexData.uvs;
                var nodeuv = this._renderableData._cacheNodeUVs;
                for (var i = 0; i < 4; i++) {
                    uv[i * 2 + 0] = nodeuv[i].x;
                    uv[i * 2 + 1] = nodeuv[i].y;
                }
            }
            if (material) {
                material.diffuseTexture = this._renderableData._cacheTexture;
                material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            }
            this._renderableData._cacheTexture.hasAlpha = true;
            this._unbindCacheTarget();
        };
        Object.defineProperty(Group2D.prototype, "cachedRect", {
            /**
             * Allow you to access the information regarding the cached rectangle of the Group2D into the MapTexture.
             * If the `noWorldSpaceNode` options was used at the creation of a WorldSpaceCanvas, the rendering of the canvas must be made by the caller, so typically you want to bind the cacheTexture property to some material/mesh and you MUST use the Group2D.cachedUVs property to get the UV coordinates to use for your quad that will display the Canvas and NOT the PackedRect.UVs property which are incorrect because the allocated surface may be bigger (due to over-provisioning or shrinking without deallocating) than what the Group is actually using.
             */
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                return this._renderableData._cacheNode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cachedUVs", {
            /**
             * The UVs into the MapTexture that map the cached group
             */
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                return this._renderableData._cacheNodeUVs;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cachedUVsChanged", {
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                if (!this._renderableData._cacheNodeUVsChangedObservable) {
                    this._renderableData._cacheNodeUVsChangedObservable = new BABYLON.Observable();
                }
                return this._renderableData._cacheNodeUVsChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cacheTexture", {
            /**
             * Access the texture that maintains a cached version of the Group2D.
             * This is useful only if you're not using a WorldSpaceNode for your WorldSpace Canvas and therefore need to perform the rendering yourself.
             */
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                return this._renderableData._cacheTexture;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Call this method to remove this Group and its children from the Canvas
         */
        Group2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._trackedNode != null) {
                this.owner._unregisterTrackedNode(this);
                this._trackedNode = null;
            }
            if (this._renderableData) {
                this._renderableData.dispose(this.owner);
                this._renderableData = null;
            }
            return true;
        };
        Object.defineProperty(Group2D.prototype, "isRenderableGroup", {
            /**
             * @returns Returns true if the Group render content, false if it's a logical group only
             */
            get: function () {
                return this._isRenderableGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "isCachedGroup", {
            /**
             * @returns only meaningful for isRenderableGroup, will be true if the content of the Group is cached into a texture, false if it's rendered every time
             */
            get: function () {
                return this._isCachedGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "size", {
            get: function () {
                return this._size;
            },
            /**
             * Get/Set the size of the group. If null the size of the group will be determine from its content.
             * BEWARE: if the Group is a RenderableGroup and its content is cache the texture will be resized each time the group is getting bigger. For performance reason the opposite won't be true: the texture won't shrink if the group does.
             */
            set: function (val) {
                this._size = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "viewportSize", {
            get: function () {
                return this._viewportSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "actualSize", {
            get: function () {
                // The computed size will be floor on both width and height
                var actualSize;
                // Return the actualSize if set
                if (this._actualSize) {
                    return this._actualSize;
                }
                // Return the size if set by the user
                if (this._size) {
                    actualSize = new BABYLON.Size(Math.ceil(this._size.width), Math.ceil(this._size.height));
                }
                else {
                    var m = this.layoutBoundingInfo.max();
                    actualSize = new BABYLON.Size(Math.ceil(m.x), Math.ceil(m.y));
                }
                // Compare the size with the one we previously had, if it differs we set the property dirty and trigger a GroupChanged to synchronize a displaySprite (if any)
                if (!actualSize.equals(this._actualSize)) {
                    this.onPrimitivePropertyDirty(Group2D.actualSizeProperty.flagId);
                    this._actualSize = actualSize;
                    this.handleGroupChanged(Group2D.actualSizeProperty);
                }
                return actualSize;
            },
            set: function (value) {
                this._actualSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cacheBehavior", {
            /**
             * Get/set the Cache Behavior, used in case the Canvas Cache Strategy is set to CACHESTRATEGY_ALLGROUPS. Can be either GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP, GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE or GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY. See their documentation for more information.
             * GROUPCACHEBEHAVIOR_NORESIZEONSCALE can also be set if you set it at creation time.
             * It is critical to understand than you HAVE TO play with this behavior in order to achieve a good performance/memory ratio. Caching all groups would certainly be the worst strategy of all.
             */
            get: function () {
                return this._cacheBehavior;
            },
            enumerable: true,
            configurable: true
        });
        Group2D.prototype._addPrimToDirtyList = function (prim) {
            this._renderableData._primDirtyList.push(prim);
        };
        Group2D.prototype._renderCachedCanvas = function () {
            this.owner._addGroupRenderCount(1);
            this.updateCachedStates(true);
            var context = new BABYLON.PrepareRender2DContext();
            this._prepareGroupRender(context);
            this._groupRender();
        };
        Object.defineProperty(Group2D.prototype, "trackedNode", {
            /**
             * Get/set the Scene's Node that should be tracked, the group's position will follow the projected position of the Node.
             */
            get: function () {
                return this._trackedNode;
            },
            set: function (val) {
                if (val != null) {
                    if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                        this.owner._registerTrackedNode(this);
                    }
                    this._trackedNode = val;
                }
                else {
                    if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                        this.owner._unregisterTrackedNode(this);
                    }
                    this._trackedNode = null;
                }
            },
            enumerable: true,
            configurable: true
        });
        Group2D.prototype.levelIntersect = function (intersectInfo) {
            // If we've made it so far it means the boundingInfo intersection test succeed, the Group2D is shaped the same, so we always return true
            return true;
        };
        Group2D.prototype.updateLevelBoundingInfo = function () {
            var size;
            // If the size is set by the user, the boundingInfo is computed from this value
            if (this.size) {
                size = this.size;
            }
            else {
                size = new BABYLON.Size(0, 0);
            }
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(size, this._levelBoundingInfo);
        };
        // Method called only on renderable groups to prepare the rendering
        Group2D.prototype._prepareGroupRender = function (context) {
            var sortedDirtyList = null;
            // Update the Global Transformation and visibility status of the changed primitives
            var rd = this._renderableData;
            if ((rd._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                sortedDirtyList = rd._primDirtyList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                this.updateCachedStatesOf(sortedDirtyList, true);
            }
            var s = this.actualSize;
            var a = this.actualScale;
            var sw = Math.ceil(s.width * a.x);
            var sh = Math.ceil(s.height * a.y);
            // The dimension must be overridden when using the designSize feature, the ratio is maintain to compute a uniform scale, which is mandatory but if the designSize's ratio is different from the rendering surface's ratio, content will be clipped in some cases.
            // So we set the width/height to the rendering's one because that's what we want for the viewport!
            if (this instanceof BABYLON.Canvas2D) {
                var c = this;
                if (c.designSize != null) {
                    sw = this.owner.engine.getRenderWidth();
                    sh = this.owner.engine.getRenderHeight();
                }
            }
            // Setup the size of the rendering viewport
            // In non cache mode, we're rendering directly to the rendering canvas, in this case we have to detect if the canvas size changed since the previous iteration, if it's the case all primitives must be prepared again because their transformation must be recompute
            if (!this._isCachedGroup) {
                // Compute the WebGL viewport's location/size
                var t = this._globalTransform.getTranslation();
                var rs = this.owner._renderingSize;
                sh = Math.min(sh, rs.height - t.y);
                sw = Math.min(sw, rs.width - t.x);
                var x = t.x;
                var y = t.y;
                // The viewport where we're rendering must be the size of the canvas if this one fit in the rendering screen or clipped to the screen dimensions if needed
                this._viewportPosition.x = x;
                this._viewportPosition.y = y;
            }
            // For a cachedGroup we also check of the group's actualSize is changing, if it's the case then the rendering zone will be change so we also have to dirty all primitives to prepare them again.
            if (this._viewportSize.width !== sw || this._viewportSize.height !== sh) {
                context.forceRefreshPrimitive = true;
                this._viewportSize.width = sw;
                this._viewportSize.height = sh;
            }
            if ((rd._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                // If the group is cached, set the dirty flag to true because of the incoming changes
                this._cacheGroupDirty = this._isCachedGroup;
                rd._primNewDirtyList.splice(0);
                // If it's a force refresh, prepare all the children
                if (context.forceRefreshPrimitive) {
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var p = _a[_i];
                        p._prepareRender(context);
                    }
                }
                else {
                    // Each primitive that changed at least once was added into the primDirtyList, we have to sort this level using
                    //  the hierarchyDepth in order to prepare primitives from top to bottom
                    if (!sortedDirtyList) {
                        sortedDirtyList = rd._primDirtyList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                    }
                    sortedDirtyList.forEach(function (p) {
                        // We need to check if prepare is needed because even if the primitive is in the dirtyList, its parent primitive may also have been modified, then prepared, then recurse on its children primitives (this one for instance) if the changes where impacting them.
                        // For instance: a Rect's position change, the position of its children primitives will also change so a prepare will be call on them. If a child was in the dirtyList we will avoid a second prepare by making this check.
                        if (!p.isDisposed && p._needPrepare()) {
                            p._prepareRender(context);
                        }
                    });
                }
                // Everything is updated, clear the dirty list
                rd._primDirtyList.forEach(function (p) {
                    if (rd._primNewDirtyList.indexOf(p) === -1) {
                        p._resetPropertiesDirty();
                    }
                    else {
                        p._setFlags(BABYLON.SmartPropertyPrim.flagNeedRefresh);
                    }
                });
                rd._primDirtyList.splice(0);
                rd._primDirtyList = rd._primDirtyList.concat(rd._primNewDirtyList);
            }
            // A renderable group has a list of direct children that are also renderable groups, we recurse on them to also prepare them
            rd._childrenRenderableGroups.forEach(function (g) {
                g._prepareGroupRender(context);
            });
        };
        Group2D.prototype._groupRender = function () {
            var _this = this;
            var engine = this.owner.engine;
            var failedCount = 0;
            // First recurse to children render group to render them (in their cache or on screen)
            for (var _i = 0, _a = this._renderableData._childrenRenderableGroups; _i < _a.length; _i++) {
                var childGroup = _a[_i];
                childGroup._groupRender();
            }
            // Render the primitives if needed: either if we don't cache the content or if the content is cached but has changed
            if (!this.isCachedGroup || this._cacheGroupDirty) {
                this.owner._addGroupRenderCount(1);
                if (this.isCachedGroup) {
                    this._bindCacheTarget();
                }
                else {
                    var curVP = engine.setDirectViewport(this._viewportPosition.x, this._viewportPosition.y, this._viewportSize.width, this._viewportSize.height);
                }
                var curAlphaTest = engine.getAlphaTesting() === true;
                var curDepthWrite = engine.getDepthWrite() === true;
                // ===================================================================
                // First pass, update the InstancedArray and render Opaque primitives
                // Disable Alpha Testing, Enable Depth Write
                engine.setAlphaTesting(false);
                engine.setDepthWrite(true);
                // For each different model of primitive to render
                var context_1 = new BABYLON.Render2DContext(BABYLON.Render2DContext.RenderModeOpaque);
                this._renderableData._renderGroupInstancesInfo.forEach(function (k, v) {
                    // Prepare the context object, update the WebGL Instanced Array buffer if needed
                    var renderCount = _this._prepareContext(engine, context_1, v);
                    // If null is returned, there's no opaque data to render
                    if (renderCount === null) {
                        return;
                    }
                    // Submit render only if we have something to render (everything may be hidden and the floatarray empty)
                    if (!_this.owner.supportInstancedArray || renderCount > 0) {
                        // render all the instances of this model, if the render method returns true then our instances are no longer dirty
                        var renderFailed = !v.modelRenderCache.render(v, context_1);
                        // Update dirty flag/related
                        v.opaqueDirty = renderFailed;
                        failedCount += renderFailed ? 1 : 0;
                    }
                });
                // =======================================================================
                // Second pass, update the InstancedArray and render AlphaTest primitives
                // Enable Alpha Testing, Enable Depth Write
                engine.setAlphaTesting(true);
                engine.setDepthWrite(true);
                // For each different model of primitive to render
                context_1 = new BABYLON.Render2DContext(BABYLON.Render2DContext.RenderModeAlphaTest);
                this._renderableData._renderGroupInstancesInfo.forEach(function (k, v) {
                    // Prepare the context object, update the WebGL Instanced Array buffer if needed
                    var renderCount = _this._prepareContext(engine, context_1, v);
                    // If null is returned, there's no opaque data to render
                    if (renderCount === null) {
                        return;
                    }
                    // Submit render only if we have something to render (everything may be hidden and the floatarray empty)
                    if (!_this.owner.supportInstancedArray || renderCount > 0) {
                        // render all the instances of this model, if the render method returns true then our instances are no longer dirty
                        var renderFailed = !v.modelRenderCache.render(v, context_1);
                        // Update dirty flag/related
                        v.opaqueDirty = renderFailed;
                        failedCount += renderFailed ? 1 : 0;
                    }
                });
                // =======================================================================
                // Third pass, transparent primitive rendering
                // Enable Alpha Testing, Disable Depth Write
                engine.setAlphaTesting(true);
                engine.setDepthWrite(false);
                // First Check if the transparent List change so we can update the TransparentSegment and PartData (sort if needed)
                if (this._renderableData._transparentListChanged) {
                    this._updateTransparentData();
                }
                // From this point on we have up to date data to render, so let's go
                failedCount += this._renderTransparentData();
                // =======================================================================
                //  Unbind target/restore viewport setting, clear dirty flag, and quit
                // The group's content is no longer dirty
                this._cacheGroupDirty = failedCount !== 0;
                if (this.isCachedGroup) {
                    this._unbindCacheTarget();
                }
                else {
                    if (curVP) {
                        engine.setViewport(curVP);
                    }
                }
                // Restore saved states
                engine.setAlphaTesting(curAlphaTest);
                engine.setDepthWrite(curDepthWrite);
            }
        };
        Group2D.prototype._setCacheGroupDirty = function () {
            this._cacheGroupDirty = true;
        };
        Group2D.prototype._updateTransparentData = function () {
            this.owner._addUpdateTransparentDataCount(1);
            var rd = this._renderableData;
            // Sort all the primitive from their depth, max (bottom) to min (top)
            rd._transparentPrimitives.sort(function (a, b) { return b._primitive.actualZOffset - a._primitive.actualZOffset; });
            var checkAndAddPrimInSegment = function (seg, tpiI) {
                var tpi = rd._transparentPrimitives[tpiI];
                // Fast rejection: if gii are different
                if (seg.groupInsanceInfo !== tpi._groupInstanceInfo) {
                    return false;
                }
                //let tpiZ = tpi._primitive.actualZOffset;
                // We've made it so far, the tpi can be part of the segment, add it
                tpi._transparentSegment = seg;
                tpi._primitive._updateTransparentSegmentIndices(seg);
                return true;
            };
            // Free the existing TransparentSegments
            for (var _i = 0, _a = rd._transparentSegments; _i < _a.length; _i++) {
                var ts = _a[_i];
                ts.dispose(this.owner.engine);
            }
            rd._transparentSegments.splice(0);
            var prevSeg = null;
            for (var tpiI = 0; tpiI < rd._transparentPrimitives.length; tpiI++) {
                var tpi = rd._transparentPrimitives[tpiI];
                // Check if the Data in which the primitive is stored is not sorted properly
                if (tpi._groupInstanceInfo.transparentOrderDirty) {
                    tpi._groupInstanceInfo.sortTransparentData();
                }
                // Reset the segment, we have to create/rebuild it
                tpi._transparentSegment = null;
                // If there's a previous valid segment, check if this prim can be part of it
                if (prevSeg) {
                    checkAndAddPrimInSegment(prevSeg, tpiI);
                }
                // If we couldn't insert in the adjacent segments, he have to create one
                if (!tpi._transparentSegment) {
                    var ts = new BABYLON.TransparentSegment();
                    ts.groupInsanceInfo = tpi._groupInstanceInfo;
                    var prim = tpi._primitive;
                    ts.startZ = prim.actualZOffset;
                    prim._updateTransparentSegmentIndices(ts);
                    ts.endZ = ts.startZ;
                    tpi._transparentSegment = ts;
                    rd._transparentSegments.push(ts);
                }
                // Update prevSeg
                prevSeg = tpi._transparentSegment;
            }
            //rd._firstChangedPrim = null;
            rd._transparentListChanged = false;
        };
        Group2D.prototype._renderTransparentData = function () {
            var failedCount = 0;
            var context = new BABYLON.Render2DContext(BABYLON.Render2DContext.RenderModeTransparent);
            var rd = this._renderableData;
            var useInstanced = this.owner.supportInstancedArray;
            var length = rd._transparentSegments.length;
            for (var i = 0; i < length; i++) {
                context.instancedBuffers = null;
                var ts = rd._transparentSegments[i];
                var gii = ts.groupInsanceInfo;
                var mrc = gii.modelRenderCache;
                var engine = this.owner.engine;
                var count = ts.endDataIndex - ts.startDataIndex;
                // Use Instanced Array if it's supported and if there's at least 5 prims to draw.
                // We don't want to create an Instanced Buffer for less that 5 prims
                if (useInstanced && count >= 5) {
                    if (!ts.partBuffers) {
                        var buffers = new Array();
                        for (var j = 0; j < gii.transparentData.length; j++) {
                            var gitd = gii.transparentData[j];
                            var dfa = gitd._partData;
                            var data = dfa.pack();
                            var stride = dfa.stride;
                            var neededSize = count * stride * 4;
                            var buffer = engine.createInstancesBuffer(neededSize); // Create + bind
                            var segData = data.subarray(ts.startDataIndex * stride, ts.endDataIndex * stride);
                            engine.updateArrayBuffer(segData);
                            buffers.push(buffer);
                        }
                        ts.partBuffers = buffers;
                    }
                    else if (gii.transparentDirty) {
                        for (var j = 0; j < gii.transparentData.length; j++) {
                            var gitd = gii.transparentData[j];
                            var dfa = gitd._partData;
                            var data = dfa.pack();
                            var stride = dfa.stride;
                            var buffer = ts.partBuffers[j];
                            var segData = data.subarray(ts.startDataIndex * stride, ts.endDataIndex * stride);
                            engine.bindArrayBuffer(buffer);
                            engine.updateArrayBuffer(segData);
                        }
                    }
                    context.useInstancing = true;
                    context.instancesCount = count;
                    context.instancedBuffers = ts.partBuffers;
                    context.groupInfoPartData = gii.transparentData;
                    var renderFailed = !mrc.render(gii, context);
                    failedCount += renderFailed ? 1 : 0;
                }
                else {
                    context.useInstancing = false;
                    context.partDataStartIndex = ts.startDataIndex;
                    context.partDataEndIndex = ts.endDataIndex;
                    context.groupInfoPartData = gii.transparentData;
                    var renderFailed = !mrc.render(gii, context);
                    failedCount += renderFailed ? 1 : 0;
                }
            }
            return failedCount;
        };
        Group2D.prototype._prepareContext = function (engine, context, gii) {
            var gipd = null;
            var setDirty;
            var getDirty;
            // Render Mode specifics
            switch (context.renderMode) {
                case BABYLON.Render2DContext.RenderModeOpaque:
                    {
                        if (!gii.hasOpaqueData) {
                            return null;
                        }
                        setDirty = function (dirty) { gii.opaqueDirty = dirty; };
                        getDirty = function () { return gii.opaqueDirty; };
                        context.groupInfoPartData = gii.opaqueData;
                        gipd = gii.opaqueData;
                        break;
                    }
                case BABYLON.Render2DContext.RenderModeAlphaTest:
                    {
                        if (!gii.hasAlphaTestData) {
                            return null;
                        }
                        setDirty = function (dirty) { gii.alphaTestDirty = dirty; };
                        getDirty = function () { return gii.alphaTestDirty; };
                        context.groupInfoPartData = gii.alphaTestData;
                        gipd = gii.alphaTestData;
                        break;
                    }
                default:
                    throw new Error("_prepareContext is only for opaque or alphaTest");
            }
            var renderCount = 0;
            // This part will pack the dynamicfloatarray and update the instanced array WebGLBufffer
            // Skip it if instanced arrays are not supported
            if (this.owner.supportInstancedArray) {
                // Flag for instancing
                context.useInstancing = true;
                // Make sure all the WebGLBuffers of the Instanced Array are created/up to date for the parts to render.
                for (var i = 0; i < gipd.length; i++) {
                    var pid = gipd[i];
                    // If the instances of the model was changed, pack the data
                    var array = pid._partData;
                    var instanceData_1 = array.pack();
                    renderCount += array.usedElementCount;
                    // Compute the size the instance buffer should have
                    var neededSize = array.usedElementCount * array.stride * 4;
                    // Check if we have to (re)create the instancesBuffer because there's none or the size is too small
                    if (!pid._partBuffer || (pid._partBufferSize < neededSize)) {
                        if (pid._partBuffer) {
                            engine.deleteInstancesBuffer(pid._partBuffer);
                        }
                        pid._partBuffer = engine.createInstancesBuffer(neededSize); // Create + bind
                        pid._partBufferSize = neededSize;
                        setDirty(false);
                        // Update the WebGL buffer to match the new content of the instances data
                        engine.updateArrayBuffer(instanceData_1);
                    }
                    else if (getDirty()) {
                        // Update the WebGL buffer to match the new content of the instances data
                        engine.bindArrayBuffer(pid._partBuffer);
                        engine.updateArrayBuffer(instanceData_1);
                    }
                }
                setDirty(false);
            }
            else {
                context.partDataStartIndex = 0;
                // Find the first valid object to get the count
                if (context.groupInfoPartData.length > 0) {
                    var i = 0;
                    while (!context.groupInfoPartData[i]) {
                        i++;
                    }
                    context.partDataEndIndex = context.groupInfoPartData[i]._partData.usedElementCount;
                }
            }
            return renderCount;
        };
        Group2D.prototype._setRenderingScale = function (scale) {
            if (this._renderableData._renderingScale === scale) {
                return;
            }
            this._renderableData._renderingScale = scale;
        };
        Group2D.prototype._bindCacheTarget = function () {
            var curWidth;
            var curHeight;
            var rd = this._renderableData;
            var rs = rd._renderingScale;
            var noResizeScale = rd._noResizeOnScale;
            var isCanvas = this.parent == null;
            var scale;
            if (noResizeScale) {
                scale = isCanvas ? Group2D._uV : this.parent.actualScale;
            }
            else {
                scale = this.actualScale;
            }
            Group2D._s.width = Math.ceil(this.actualSize.width * scale.x * rs);
            Group2D._s.height = Math.ceil(this.actualSize.height * scale.y * rs);
            var sizeChanged = !Group2D._s.equals(rd._cacheSize);
            if (rd._cacheNode) {
                var size = rd._cacheNode.contentSize;
                // Check if we have to deallocate because the size is too small
                if ((size.width < Group2D._s.width) || (size.height < Group2D._s.height)) {
                    // For Screen space: over-provisioning of 7% more to avoid frequent resizing for few pixels...
                    // For World space: no over-provisioning
                    var overprovisioning = this.owner.isScreenSpace ? 1.07 : 1;
                    curWidth = Math.floor(Group2D._s.width * overprovisioning);
                    curHeight = Math.floor(Group2D._s.height * overprovisioning);
                    //console.log(`[${this._globalTransformProcessStep}] Resize group ${this.id}, width: ${curWidth}, height: ${curHeight}`);
                    rd._cacheTexture.freeRect(rd._cacheNode);
                    rd._cacheNode = null;
                }
            }
            if (!rd._cacheNode) {
                // Check if we have to allocate a rendering zone in the global cache texture
                var res = this.owner._allocateGroupCache(this, this.parent && this.parent.renderGroup, curWidth ? new BABYLON.Size(curWidth, curHeight) : null, rd._useMipMap, rd._anisotropicLevel);
                rd._cacheNode = res.node;
                rd._cacheTexture = res.texture;
                rd._cacheRenderSprite = res.sprite;
                sizeChanged = true;
            }
            if (sizeChanged) {
                rd._cacheSize.copyFrom(Group2D._s);
                rd._cacheNodeUVs = rd._cacheNode.getUVsForCustomSize(rd._cacheSize);
                if (rd._cacheNodeUVsChangedObservable && rd._cacheNodeUVsChangedObservable.hasObservers()) {
                    rd._cacheNodeUVsChangedObservable.notifyObservers(rd._cacheNodeUVs);
                }
                this._setFlags(BABYLON.SmartPropertyPrim.flagWorldCacheChanged);
            }
            var n = rd._cacheNode;
            rd._cacheTexture.bindTextureForPosSize(n.pos, Group2D._s, true);
        };
        Group2D.prototype._unbindCacheTarget = function () {
            if (this._renderableData._cacheTexture) {
                this._renderableData._cacheTexture.unbindTexture();
            }
        };
        Group2D.prototype.handleGroupChanged = function (prop) {
            // This method is only for cachedGroup
            var rd = this._renderableData;
            if (!rd) {
                return;
            }
            var cachedSprite = rd._cacheRenderSprite;
            if (!this.isCachedGroup || !cachedSprite) {
                return;
            }
            // For now we only support these property changes
            // TODO: add more! :)
            if (prop.id === BABYLON.Prim2DBase.actualPositionProperty.id) {
                cachedSprite.actualPosition = this.actualPosition.clone();
                if (cachedSprite.position != null) {
                    cachedSprite.position = cachedSprite.actualPosition.clone();
                }
            }
            else if (prop.id === BABYLON.Prim2DBase.rotationProperty.id) {
                cachedSprite.rotation = this.rotation;
            }
            else if (prop.id === BABYLON.Prim2DBase.scaleProperty.id) {
                cachedSprite.scale = this.scale;
            }
            else if (prop.id === BABYLON.Prim2DBase.originProperty.id) {
                cachedSprite.origin = this.origin.clone();
            }
            else if (prop.id === Group2D.actualSizeProperty.id) {
                cachedSprite.size = this.actualSize.clone();
            }
        };
        Group2D.prototype.detectGroupStates = function () {
            var isCanvas = this instanceof BABYLON.Canvas2D;
            var canvasStrat = this.owner.cachingStrategy;
            // In Don't Cache mode, only the canvas is renderable, all the other groups are logical. There are not a single cached group.
            if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_DONTCACHE) {
                this._isRenderableGroup = isCanvas;
                this._isCachedGroup = false;
            }
            else if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_CANVAS) {
                if (isCanvas) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = true;
                }
                else {
                    this._isRenderableGroup = this.id === "__cachedCanvasGroup__";
                    this._isCachedGroup = false;
                }
            }
            else if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                if (isCanvas) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = false;
                }
                else {
                    if (this.hierarchyDepth === 1) {
                        this._isRenderableGroup = true;
                        this._isCachedGroup = true;
                    }
                    else {
                        this._isRenderableGroup = false;
                        this._isCachedGroup = false;
                    }
                }
            }
            else if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_ALLGROUPS) {
                var gcb = this.cacheBehavior & Group2D.GROUPCACHEBEHAVIOR_OPTIONMASK;
                if ((gcb === Group2D.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE) || (gcb === Group2D.GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP)) {
                    this._isRenderableGroup = gcb === Group2D.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE;
                    this._isCachedGroup = false;
                }
                if (gcb === Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = true;
                }
            }
            if (this._isRenderableGroup) {
                // Yes, we do need that check, trust me, unfortunately we can call _detectGroupStates many time on the same object...
                if (!this._renderableData) {
                    this._renderableData = new RenderableGroupData();
                }
            }
            // If the group is tagged as renderable we add it to the renderable tree
            if (this._isCachedGroup) {
                this._renderableData._noResizeOnScale = (this.cacheBehavior & Group2D.GROUPCACHEBEHAVIOR_NORESIZEONSCALE) !== 0;
                var cur = this.parent;
                while (cur) {
                    if (cur instanceof Group2D && cur._isRenderableGroup) {
                        if (cur._renderableData._childrenRenderableGroups.indexOf(this) === -1) {
                            cur._renderableData._childrenRenderableGroups.push(this);
                        }
                        break;
                    }
                    cur = cur.parent;
                }
            }
        };
        Group2D.GROUP2D_PROPCOUNT = BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;
        /**
         * Default behavior, the group will use the caching strategy defined at the Canvas Level
         */
        Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY = 0;
        /**
         * When used, this group's content won't be cached, no matter which strategy used.
         * If the group is part of a WorldSpace Canvas, its content will be drawn in the Canvas cache bitmap.
         */
        Group2D.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE = 1;
        /**
         * When used, the group's content will be cached in the nearest cached parent group/canvas
         */
        Group2D.GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP = 2;
        /**
         * You can specify this behavior to any cached Group2D to indicate that you don't want the cached content to be resized when the Group's actualScale is changing. It will draw the content stretched or shrink which is faster than a resize. This setting is obviously for performance consideration, don't use it if you want the best rendering quality
         */
        Group2D.GROUPCACHEBEHAVIOR_NORESIZEONSCALE = 0x100;
        Group2D.GROUPCACHEBEHAVIOR_OPTIONMASK = 0xFF;
        Group2D._uV = new BABYLON.Vector2(1, 1);
        Group2D._s = BABYLON.Size.Zero();
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, function (pi) { return Group2D.sizeProperty = pi; }, false, true)
        ], Group2D.prototype, "size", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 2, function (pi) { return Group2D.actualSizeProperty = pi; })
        ], Group2D.prototype, "actualSize", null);
        Group2D = __decorate([
            BABYLON.className("Group2D", "BABYLON")
        ], Group2D);
        return Group2D;
    }(BABYLON.Prim2DBase));
    BABYLON.Group2D = Group2D;
    var RenderableGroupData = (function () {
        function RenderableGroupData() {
            this._primDirtyList = new Array();
            this._primNewDirtyList = new Array();
            this._childrenRenderableGroups = new Array();
            this._renderGroupInstancesInfo = new BABYLON.StringDictionary();
            this._transparentPrimitives = new Array();
            this._transparentSegments = new Array();
            this._transparentListChanged = false;
            this._cacheNode = null;
            this._cacheTexture = null;
            this._cacheRenderSprite = null;
            this._renderingScale = 1;
            this._cacheNodeUVs = null;
            this._cacheNodeUVsChangedObservable = null;
            this._cacheSize = BABYLON.Size.Zero();
            this._useMipMap = false;
            this._anisotropicLevel = 1;
            this._noResizeOnScale = false;
        }
        RenderableGroupData.prototype.dispose = function (owner) {
            var engine = owner.engine;
            if (this._cacheRenderSprite) {
                this._cacheRenderSprite.dispose();
                this._cacheRenderSprite = null;
            }
            if (this._cacheTexture && this._cacheNode) {
                this._cacheTexture.freeRect(this._cacheNode);
                this._cacheTexture = null;
                this._cacheNode = null;
            }
            if (this._primDirtyList) {
                this._primDirtyList.splice(0);
                this._primDirtyList = null;
            }
            if (this._renderGroupInstancesInfo) {
                this._renderGroupInstancesInfo.forEach(function (k, v) {
                    v.dispose();
                });
                this._renderGroupInstancesInfo = null;
            }
            if (this._cacheNodeUVsChangedObservable) {
                this._cacheNodeUVsChangedObservable.clear();
                this._cacheNodeUVsChangedObservable = null;
            }
            if (this._transparentSegments) {
                for (var _i = 0, _a = this._transparentSegments; _i < _a.length; _i++) {
                    var ts = _a[_i];
                    ts.dispose(engine);
                }
                this._transparentSegments.splice(0);
                this._transparentSegments = null;
            }
        };
        RenderableGroupData.prototype.addNewTransparentPrimitiveInfo = function (prim, gii) {
            var tpi = new TransparentPrimitiveInfo();
            tpi._primitive = prim;
            tpi._groupInstanceInfo = gii;
            tpi._transparentSegment = null;
            this._transparentPrimitives.push(tpi);
            this._transparentListChanged = true;
            return tpi;
        };
        RenderableGroupData.prototype.removeTransparentPrimitiveInfo = function (tpi) {
            var index = this._transparentPrimitives.indexOf(tpi);
            if (index !== -1) {
                this._transparentPrimitives.splice(index, 1);
                this._transparentListChanged = true;
            }
        };
        RenderableGroupData.prototype.transparentPrimitiveZChanged = function (tpi) {
            this._transparentListChanged = true;
            //this.updateSmallestZChangedPrim(tpi);
        };
        return RenderableGroupData;
    }());
    BABYLON.RenderableGroupData = RenderableGroupData;
    var TransparentPrimitiveInfo = (function () {
        function TransparentPrimitiveInfo() {
        }
        return TransparentPrimitiveInfo;
    }());
    BABYLON.TransparentPrimitiveInfo = TransparentPrimitiveInfo;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Rectangle2DRenderCache = (function (_super) {
        __extends(Rectangle2DRenderCache, _super);
        function Rectangle2DRenderCache(engine, modelKey) {
            _super.call(this, engine, modelKey);
            this.effectsReady = false;
            this.fillVB = null;
            this.fillIB = null;
            this.fillIndicesCount = 0;
            this.instancingFillAttributes = null;
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.borderVB = null;
            this.borderIB = null;
            this.borderIndicesCount = 0;
            this.instancingBorderAttributes = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
        }
        Rectangle2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effectFill && (!this.effectFill.isReady() || (this.effectFillInstanced && !this.effectFillInstanced.isReady()))) ||
                    (this.effectBorder && (!this.effectBorder.isReady() || (this.effectBorderInstanced && !this.effectBorderInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }
            var curAlphaMode = engine.getAlphaMode();
            if (this.effectFill) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_FILLPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.fillIndicesCount);
                    }
                }
            }
            if (this.effectBorder) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_BORDERPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }
            engine.setAlphaMode(curAlphaMode, true);
            if (this.effectFill && this.effectBorder) {
                engine.setDepthFunction(depthFunction);
            }
            return true;
        };
        Rectangle2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.fillVB) {
                this._engine._releaseBuffer(this.fillVB);
                this.fillVB = null;
            }
            if (this.fillIB) {
                this._engine._releaseBuffer(this.fillIB);
                this.fillIB = null;
            }
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
            if (this.borderVB) {
                this._engine._releaseBuffer(this.borderVB);
                this.borderVB = null;
            }
            if (this.borderIB) {
                this._engine._releaseBuffer(this.borderIB);
                this.borderIB = null;
            }
            return true;
        };
        return Rectangle2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Rectangle2DRenderCache = Rectangle2DRenderCache;
    var Rectangle2DInstanceData = (function (_super) {
        __extends(Rectangle2DInstanceData, _super);
        function Rectangle2DInstanceData(partId) {
            _super.call(this, partId, 1);
        }
        Object.defineProperty(Rectangle2DInstanceData.prototype, "properties", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData()
        ], Rectangle2DInstanceData.prototype, "properties", null);
        return Rectangle2DInstanceData;
    }(BABYLON.Shape2DInstanceData));
    BABYLON.Rectangle2DInstanceData = Rectangle2DInstanceData;
    var Rectangle2D = (function (_super) {
        __extends(Rectangle2D, _super);
        /**
         * Create an Rectangle 2D Shape primitive. May be a sharp rectangle (with sharp corners), or a rounded one.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y settings can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height settings can be set. Default will be [10;10].
         * - roundRadius: if the rectangle has rounded corner, set their radius, default is 0 (to get a sharp edges rectangle).
         * - fill: the brush used to draw the fill content of the rectangle, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can also be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the rectangle, you can set null to draw nothing (but you will have to set a fill brush), default is null. can also be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the primitive must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Rectangle2D(settings) {
            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }
            _super.call(this, settings);
            if (settings.size != null) {
                this.size = settings.size;
            }
            else if (settings.width || settings.height) {
                var size = new BABYLON.Size(settings.width, settings.height);
                this.size = size;
            }
            //let size            = settings.size || (new Size((settings.width === null) ? null : (settings.width || 10), (settings.height === null) ? null : (settings.height || 10)));
            var roundRadius = (settings.roundRadius == null) ? 0 : settings.roundRadius;
            var borderThickness = (settings.borderThickness == null) ? 1 : settings.borderThickness;
            //this.size            = size;
            this.roundRadius = roundRadius;
            this.borderThickness = borderThickness;
        }
        Object.defineProperty(Rectangle2D.prototype, "actualSize", {
            get: function () {
                if (this._actualSize) {
                    return this._actualSize;
                }
                return this.size;
            },
            set: function (value) {
                this._actualSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle2D.prototype, "notRounded", {
            get: function () {
                return this._notRounded;
            },
            set: function (value) {
                this._notRounded = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle2D.prototype, "roundRadius", {
            get: function () {
                return this._roundRadius;
            },
            set: function (value) {
                this._roundRadius = value;
                this.notRounded = value === 0;
                this._positioningDirty();
            },
            enumerable: true,
            configurable: true
        });
        Rectangle2D.prototype.levelIntersect = function (intersectInfo) {
            // If we got there it mean the boundingInfo intersection succeed, if the rectangle has not roundRadius, it means it succeed!
            if (this.notRounded) {
                return true;
            }
            // If we got so far it means the bounding box at least passed, so we know it's inside the bounding rectangle, but it can be outside the roundedRectangle.
            // The easiest way is to check if the point is inside on of the four corners area (a little square of roundRadius size at the four corners)
            // If it's the case for one, check if the mouse is located in the quarter that we care about (the one who is visible) then finally make a distance check with the roundRadius radius to see if it's inside the circle quarter or outside.
            // First let remove the origin out the equation, to have the rectangle with an origin at bottom/left
            var size = this.size;
            Rectangle2D._i0.x = intersectInfo._localPickPosition.x;
            Rectangle2D._i0.y = intersectInfo._localPickPosition.y;
            var rr = this.roundRadius;
            var rrs = rr * rr;
            // Check if the point is in the bottom/left quarter area
            Rectangle2D._i1.x = rr;
            Rectangle2D._i1.y = rr;
            if (Rectangle2D._i0.x <= Rectangle2D._i1.x && Rectangle2D._i0.y <= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }
            // Check if the point is in the top/left quarter area
            Rectangle2D._i1.x = rr;
            Rectangle2D._i1.y = size.height - rr;
            if (Rectangle2D._i0.x <= Rectangle2D._i1.x && Rectangle2D._i0.y >= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }
            // Check if the point is in the top/right quarter area
            Rectangle2D._i1.x = size.width - rr;
            Rectangle2D._i1.y = size.height - rr;
            if (Rectangle2D._i0.x >= Rectangle2D._i1.x && Rectangle2D._i0.y >= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }
            // Check if the point is in the bottom/right quarter area
            Rectangle2D._i1.x = size.width - rr;
            Rectangle2D._i1.y = rr;
            if (Rectangle2D._i0.x >= Rectangle2D._i1.x && Rectangle2D._i0.y <= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }
            // At any other locations the point is guarantied to be inside
            return true;
        };
        Rectangle2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
        };
        Rectangle2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Rectangle2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Rectangle2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var vbSize = ((this.notRounded ? 1 : Rectangle2D.roundSubdivisions) * 4) + 1;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.fillVB = engine.createVertexBuffer(vb);
                var triCount = vbSize - 1;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < triCount; i++) {
                    ib[i * 3 + 0] = 0;
                    ib[i * 3 + 2] = i + 1;
                    ib[i * 3 + 1] = i + 2;
                }
                ib[triCount * 3 - 2] = 1;
                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = triCount * 3;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, false);
                renderCache.effectFill = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            // Need to create WebGL resource for border part?
            if (this.border) {
                var vbSize = (this.notRounded ? 1 : Rectangle2D.roundSubdivisions) * 4 * 2;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.borderVB = engine.createVertexBuffer(vb);
                var triCount = vbSize;
                var rs = triCount / 2;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < rs; i++) {
                    var r0 = i;
                    var r1 = (i + 1) % rs;
                    ib[i * 6 + 0] = rs + r1;
                    ib[i * 6 + 1] = rs + r0;
                    ib[i * 6 + 2] = r0;
                    ib[i * 6 + 3] = r1;
                    ib[i * 6 + 4] = rs + r1;
                    ib[i * 6 + 5] = r0;
                }
                renderCache.borderIB = engine.createIndexBuffer(ib);
                renderCache.borderIndicesCount = triCount * 3;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, false);
                renderCache.effectBorder = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            return renderCache;
        };
        // We override this method because if there's a roundRadius set, we will reduce the initial Content Area to make sure the computed area won't intersect with the shape contour. The formula is simple: we shrink the incoming size by the amount of the roundRadius
        Rectangle2D.prototype._getInitialContentAreaToRef = function (primSize, initialContentPosition, initialContentArea) {
            // Fall back to default implementation if there's no round Radius
            if (this._notRounded) {
                _super.prototype._getInitialContentAreaToRef.call(this, primSize, initialContentPosition, initialContentArea);
            }
            else {
                var rr = Math.round((this.roundRadius - (this.roundRadius / Math.sqrt(2))) * 1.3);
                initialContentPosition.x = initialContentPosition.y = rr;
                initialContentArea.width = Math.max(0, primSize.width - (rr * 2));
                initialContentArea.height = Math.max(0, primSize.height - (rr * 2));
                initialContentPosition.z = primSize.width - (initialContentPosition.x + initialContentArea.width);
                initialContentPosition.w = primSize.height - (initialContentPosition.y + initialContentArea.height);
            }
        };
        Rectangle2D.prototype._getActualSizeFromContentToRef = function (primSize, newPrimSize) {
            // Fall back to default implementation if there's no round Radius
            if (this._notRounded) {
                _super.prototype._getActualSizeFromContentToRef.call(this, primSize, newPrimSize);
            }
            else {
                var rr = Math.round((this.roundRadius - (this.roundRadius / Math.sqrt(2))) * 1.3);
                newPrimSize.copyFrom(primSize);
                newPrimSize.width += rr * 2;
                newPrimSize.height += rr * 2;
            }
        };
        Rectangle2D.prototype.createInstanceDataParts = function () {
            var res = new Array();
            if (this.border) {
                res.push(new Rectangle2DInstanceData(BABYLON.Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Rectangle2DInstanceData(BABYLON.Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        };
        Rectangle2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === BABYLON.Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.roundRadius || 0);
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.roundRadius || 0);
            }
            return true;
        };
        Rectangle2D._i0 = BABYLON.Vector2.Zero();
        Rectangle2D._i1 = BABYLON.Vector2.Zero();
        Rectangle2D._i2 = BABYLON.Vector2.Zero();
        Rectangle2D.roundSubdivisions = 16;
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 1, function (pi) { return Rectangle2D.actualSizeProperty = pi; }, false, true)
        ], Rectangle2D.prototype, "actualSize", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Rectangle2D.notRoundedProperty = pi; })
        ], Rectangle2D.prototype, "notRounded", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 3, function (pi) { return Rectangle2D.roundRadiusProperty = pi; })
        ], Rectangle2D.prototype, "roundRadius", null);
        Rectangle2D = __decorate([
            BABYLON.className("Rectangle2D", "BABYLON")
        ], Rectangle2D);
        return Rectangle2D;
    }(BABYLON.Shape2D));
    BABYLON.Rectangle2D = Rectangle2D;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Ellipse2DRenderCache = (function (_super) {
        __extends(Ellipse2DRenderCache, _super);
        function Ellipse2DRenderCache(engine, modelKey) {
            _super.call(this, engine, modelKey);
            this.effectsReady = false;
            this.fillVB = null;
            this.fillIB = null;
            this.fillIndicesCount = 0;
            this.instancingFillAttributes = null;
            this.effectFillInstanced = null;
            this.effectFill = null;
            this.borderVB = null;
            this.borderIB = null;
            this.borderIndicesCount = 0;
            this.instancingBorderAttributes = null;
            this.effectBorderInstanced = null;
            this.effectBorder = null;
        }
        Ellipse2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effectFill && (!this.effectFill.isReady() || (this.effectFillInstanced && !this.effectFillInstanced.isReady()))) ||
                    (this.effectBorder && (!this.effectBorder.isReady() || (this.effectBorderInstanced && !this.effectBorderInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }
            var curAlphaMode = engine.getAlphaMode();
            if (this.effectFill) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_FILLPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.fillIndicesCount);
                    }
                }
            }
            if (this.effectBorder) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_BORDERPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }
            engine.setAlphaMode(curAlphaMode, true);
            if (this.effectFill && this.effectBorder) {
                engine.setDepthFunction(depthFunction);
            }
            return true;
        };
        Ellipse2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.fillVB) {
                this._engine._releaseBuffer(this.fillVB);
                this.fillVB = null;
            }
            if (this.fillIB) {
                this._engine._releaseBuffer(this.fillIB);
                this.fillIB = null;
            }
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
            if (this.borderVB) {
                this._engine._releaseBuffer(this.borderVB);
                this.borderVB = null;
            }
            if (this.borderIB) {
                this._engine._releaseBuffer(this.borderIB);
                this.borderIB = null;
            }
            return true;
        };
        return Ellipse2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Ellipse2DRenderCache = Ellipse2DRenderCache;
    var Ellipse2DInstanceData = (function (_super) {
        __extends(Ellipse2DInstanceData, _super);
        function Ellipse2DInstanceData(partId) {
            _super.call(this, partId, 1);
        }
        Object.defineProperty(Ellipse2DInstanceData.prototype, "properties", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData()
        ], Ellipse2DInstanceData.prototype, "properties", null);
        return Ellipse2DInstanceData;
    }(BABYLON.Shape2DInstanceData));
    BABYLON.Ellipse2DInstanceData = Ellipse2DInstanceData;
    var Ellipse2D = (function (_super) {
        __extends(Ellipse2D, _super);
        /**
         * Create an Ellipse 2D Shape primitive
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id: a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height properties can be set. Default will be [10;10].
         * - subdivision: the number of subdivision to create the ellipse perimeter, default is 64.
         * - fill: the brush used to draw the fill content of the ellipse, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can also be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the ellipse, you can set null to draw nothing (but you will have to set a fill brush), default is null. can be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the group must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Ellipse2D(settings) {
            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }
            _super.call(this, settings);
            if (settings.size != null) {
                this.size = settings.size;
            }
            else if (settings.width || settings.height) {
                var size = new BABYLON.Size(settings.width, settings.height);
                this.size = size;
            }
            var sub = (settings.subdivisions == null) ? 64 : settings.subdivisions;
            this.subdivisions = sub;
        }
        Object.defineProperty(Ellipse2D.prototype, "actualSize", {
            get: function () {
                if (this._actualSize) {
                    return this._actualSize;
                }
                return this.size;
            },
            set: function (value) {
                this._actualSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ellipse2D.prototype, "subdivisions", {
            get: function () {
                return this._subdivisions;
            },
            set: function (value) {
                this._subdivisions = value;
            },
            enumerable: true,
            configurable: true
        });
        Ellipse2D.prototype.levelIntersect = function (intersectInfo) {
            var w = this.size.width / 2;
            var h = this.size.height / 2;
            var x = intersectInfo._localPickPosition.x - w;
            var y = intersectInfo._localPickPosition.y - h;
            return ((x * x) / (w * w) + (y * y) / (h * h)) <= 1;
        };
        Ellipse2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
        };
        Ellipse2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Ellipse2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Ellipse2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var vbSize = this.subdivisions + 1;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.fillVB = engine.createVertexBuffer(vb);
                var triCount = vbSize - 1;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < triCount; i++) {
                    ib[i * 3 + 0] = 0;
                    ib[i * 3 + 2] = i + 1;
                    ib[i * 3 + 1] = i + 2;
                }
                ib[triCount * 3 - 2] = 1;
                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = triCount * 3;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, false);
                renderCache.effectFill = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            // Need to create WebGL resource for border part?
            if (this.border) {
                var vbSize = this.subdivisions * 2;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.borderVB = engine.createVertexBuffer(vb);
                var triCount = vbSize;
                var rs = triCount / 2;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < rs; i++) {
                    var r0 = i;
                    var r1 = (i + 1) % rs;
                    ib[i * 6 + 0] = rs + r1;
                    ib[i * 6 + 1] = rs + r0;
                    ib[i * 6 + 2] = r0;
                    ib[i * 6 + 3] = r1;
                    ib[i * 6 + 4] = rs + r1;
                    ib[i * 6 + 5] = r0;
                }
                renderCache.borderIB = engine.createIndexBuffer(ib);
                renderCache.borderIndicesCount = (triCount * 3);
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect("ellipse2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, false);
                renderCache.effectBorder = engine.createEffect("ellipse2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            return renderCache;
        };
        Ellipse2D.prototype.createInstanceDataParts = function () {
            var res = new Array();
            if (this.border) {
                res.push(new Ellipse2DInstanceData(BABYLON.Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Ellipse2DInstanceData(BABYLON.Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        };
        Ellipse2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === BABYLON.Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.subdivisions);
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.subdivisions);
            }
            return true;
        };
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 1, function (pi) { return Ellipse2D.acutalSizeProperty = pi; }, false, true)
        ], Ellipse2D.prototype, "actualSize", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Ellipse2D.subdivisionsProperty = pi; })
        ], Ellipse2D.prototype, "subdivisions", null);
        Ellipse2D = __decorate([
            BABYLON.className("Ellipse2D", "BABYLON")
        ], Ellipse2D);
        return Ellipse2D;
    }(BABYLON.Shape2D));
    BABYLON.Ellipse2D = Ellipse2D;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Sprite2DRenderCache = (function (_super) {
        __extends(Sprite2DRenderCache, _super);
        function Sprite2DRenderCache() {
            _super.apply(this, arguments);
            this.effectsReady = false;
            this.vb = null;
            this.ib = null;
            this.instancingAttributes = null;
            this.texture = null;
            this.effect = null;
            this.effectInstanced = null;
        }
        Sprite2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var cur = engine.getAlphaMode();
            var effect = context.useInstancing ? this.effectInstanced : this.effect;
            engine.enableEffect(effect);
            effect.setTexture("diffuseSampler", this.texture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, effect);
            if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
            }
            effect.setBool("alphaTest", context.renderMode === BABYLON.Render2DContext.RenderModeAlphaTest);
            var pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Sprite2D.SPRITE2D_MAINPARTID, effect);
                }
                var glBuffer = context.instancedBuffers ? context.instancedBuffers[0] : pid._partBuffer;
                var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                canvas._addDrawCallCount(1, context.renderMode);
                engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingAttributes);
                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            }
            else {
                canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
                    engine.draw(true, 0, 6);
                }
            }
            engine.setAlphaMode(cur, true);
            return true;
        };
        Sprite2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.vb) {
                this._engine._releaseBuffer(this.vb);
                this.vb = null;
            }
            if (this.ib) {
                this._engine._releaseBuffer(this.ib);
                this.ib = null;
            }
            //if (this.texture) {
            //    this.texture.dispose();
            //    this.texture = null;
            //}
            this.effect = null;
            this.effectInstanced = null;
            return true;
        };
        return Sprite2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Sprite2DRenderCache = Sprite2DRenderCache;
    var Sprite2DInstanceData = (function (_super) {
        __extends(Sprite2DInstanceData, _super);
        function Sprite2DInstanceData(partId) {
            _super.call(this, partId, 1);
        }
        Object.defineProperty(Sprite2DInstanceData.prototype, "topLeftUV", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "sizeUV", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "scaleFactor", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "textureSize", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "properties", {
            // 3 floats being:
            // - x: frame number to display
            // - y: invertY setting
            // - z: alignToPixel setting
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "topLeftUV", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "sizeUV", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "scaleFactor", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "textureSize", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "properties", null);
        return Sprite2DInstanceData;
    }(BABYLON.InstanceDataBase));
    BABYLON.Sprite2DInstanceData = Sprite2DInstanceData;
    var Sprite2D = (function (_super) {
        __extends(Sprite2D, _super);
        /**
         * Create an 2D Sprite primitive
         * @param texture the texture that stores the sprite to render
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - spriteSize: the size of the sprite (in pixels), if null the size of the given texture will be used, default is null.
         * - spriteLocation: the location (in pixels) in the texture of the top/left corner of the Sprite to display, default is null (0,0)
         * - spriteScaleFactor: say you want to display a sprite twice as big as its bitmap which is 64,64, you set the spriteSize to 128,128 and have to set the spriteScaleFactory to 0.5,0.5 in order to address only the 64,64 pixels of the bitmaps. Default is 1,1.
         * - invertY: if true the texture Y will be inverted, default is false.
         * - alignToPixel: if true the sprite's texels will be aligned to the rendering viewport pixels, ensuring the best rendering quality but slow animations won't be done as smooth as if you set false. If false a texel could lies between two pixels, being blended by the texture sampling mode you choose, the rendering result won't be as good, but very slow animation will be overall better looking. Default is true: content will be aligned.
         * - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Sprite2D(texture, settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            this.texture = texture;
            this.texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.size = settings.spriteSize;
            this.spriteLocation = settings.spriteLocation || new BABYLON.Vector2(0, 0);
            this.spriteScaleFactor = settings.spriteScaleFactor || new BABYLON.Vector2(1, 1);
            this.spriteFrame = 0;
            this.invertY = (settings.invertY == null) ? false : settings.invertY;
            this.alignToPixel = (settings.alignToPixel == null) ? true : settings.alignToPixel;
            this.useAlphaFromTexture = true;
            if (settings.spriteSize == null || !texture.isReady()) {
                if (texture.isReady()) {
                    this.size = texture.getBaseSize();
                }
                else {
                    texture.onLoadObservable.add(function () {
                        if (settings.spriteSize == null) {
                            _this.size = texture.getBaseSize();
                        }
                        _this._positioningDirty();
                        _this._instanceDirtyFlags |= BABYLON.Prim2DBase.originProperty.flagId | Sprite2D.textureProperty.flagId; // To make sure the sprite is issued again for render
                    });
                }
            }
        }
        Object.defineProperty(Sprite2D.prototype, "texture", {
            get: function () {
                return this._texture;
            },
            set: function (value) {
                this._texture = value;
                this._oldTextureHasAlpha = this._texture && this.texture.hasAlpha;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "useAlphaFromTexture", {
            get: function () {
                return this._useAlphaFromTexture;
            },
            set: function (value) {
                if (this._useAlphaFromTexture === value) {
                    return;
                }
                this._useAlphaFromTexture = value;
                this._updateRenderMode();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "actualSize", {
            get: function () {
                if (this._actualSize) {
                    return this._actualSize;
                }
                return this.size;
            },
            set: function (value) {
                this._actualSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "spriteLocation", {
            get: function () {
                return this._location;
            },
            set: function (value) {
                this._location = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "spriteFrame", {
            get: function () {
                return this._spriteFrame;
            },
            set: function (value) {
                this._spriteFrame = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "invertY", {
            get: function () {
                return this._invertY;
            },
            set: function (value) {
                this._invertY = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "spriteScaleFactor", {
            get: function () {
                return this._spriteScaleFactor;
            },
            set: function (value) {
                this._spriteScaleFactor = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Sets the scale of the sprite using a BABYLON.Size(w,h).
         * Keeps proportion by taking the maximum of the two scale for x and y.
         * @param {Size} size Size(width,height)
         */
        Sprite2D.prototype.scaleToSize = function (size) {
            var baseSize = this.size;
            if (baseSize == null || !this.texture.isReady()) {
                // we're probably at initiation of the scene, size is not set
                if (this.texture.isReady()) {
                    baseSize = this.texture.getBaseSize();
                }
                else {
                    // the texture is not ready, wait for it to load before calling scaleToSize again
                    var thisObject = this;
                    this.texture.onLoadObservable.add(function () {
                        thisObject.scaleToSize(size);
                    });
                    return;
                }
            }
            this.scale = Math.max(size.height / baseSize.height, size.width / baseSize.width);
        };
        Object.defineProperty(Sprite2D.prototype, "alignToPixel", {
            /**
             * Get/set if the sprite rendering should be aligned to the target rendering device pixel or not
             */
            get: function () {
                return this._alignToPixel;
            },
            set: function (value) {
                this._alignToPixel = value;
            },
            enumerable: true,
            configurable: true
        });
        Sprite2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo);
        };
        /**
         * Get the animatable array (see http://doc.babylonjs.com/tutorials/Animations)
         */
        Sprite2D.prototype.getAnimatables = function () {
            var res = new Array();
            if (this.texture && this.texture.animations && this.texture.animations.length > 0) {
                res.push(this.texture);
            }
            return res;
        };
        Sprite2D.prototype.levelIntersect = function (intersectInfo) {
            // If we've made it so far it means the boundingInfo intersection test succeed, the Sprite2D is shaped the same, so we always return true
            return true;
        };
        Sprite2D._createCachedCanvasSprite = function (owner, texture, size, pos) {
            var sprite = new Sprite2D(texture, { parent: owner, id: "__cachedCanvasSprite__", position: BABYLON.Vector2.Zero(), origin: BABYLON.Vector2.Zero(), spriteSize: size, spriteLocation: pos, alignToPixel: true });
            return sprite;
        };
        Sprite2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Sprite2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Sprite2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            var vb = new Float32Array(4);
            for (var i = 0; i < 4; i++) {
                vb[i] = i;
            }
            renderCache.vb = engine.createVertexBuffer(vb);
            var ib = new Float32Array(6);
            ib[0] = 0;
            ib[1] = 2;
            ib[2] = 1;
            ib[3] = 0;
            ib[4] = 3;
            ib[5] = 2;
            renderCache.ib = engine.createIndexBuffer(ib);
            renderCache.texture = this.texture;
            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            var ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"], ["alphaTest"], true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }
            ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"], ["alphaTest"], false);
            renderCache.effect = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            return renderCache;
        };
        Sprite2D.prototype.createInstanceDataParts = function () {
            return [new Sprite2DInstanceData(Sprite2D.SPRITE2D_MAINPARTID)];
        };
        Sprite2D.prototype.beforeRefreshForLayoutConstruction = function (part) {
            Sprite2D.layoutConstructMode = true;
        };
        // if obj contains something, we restore the _text property
        Sprite2D.prototype.afterRefreshForLayoutConstruction = function (part, obj) {
            Sprite2D.layoutConstructMode = false;
        };
        Sprite2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (!this.texture.isReady() && !Sprite2D.layoutConstructMode) {
                return false;
            }
            if (part.id === Sprite2D.SPRITE2D_MAINPARTID) {
                var d = this._instanceDataParts[0];
                if (Sprite2D.layoutConstructMode) {
                    d.topLeftUV = BABYLON.Vector2.Zero();
                    d.sizeUV = BABYLON.Vector2.Zero();
                    d.properties = BABYLON.Vector3.Zero();
                    d.textureSize = BABYLON.Vector2.Zero();
                    d.scaleFactor = BABYLON.Vector2.Zero();
                }
                else {
                    var ts = this.texture.getBaseSize();
                    var sl = this.spriteLocation;
                    var ss = this.actualSize;
                    var ssf = this.spriteScaleFactor;
                    d.topLeftUV = new BABYLON.Vector2(sl.x / ts.width, sl.y / ts.height);
                    var suv = new BABYLON.Vector2(ss.width / ts.width, ss.height / ts.height);
                    d.sizeUV = suv;
                    d.scaleFactor = ssf;
                    Sprite2D._prop.x = this.spriteFrame;
                    Sprite2D._prop.y = this.invertY ? 1 : 0;
                    Sprite2D._prop.z = this.alignToPixel ? 1 : 0;
                    d.properties = Sprite2D._prop;
                    d.textureSize = new BABYLON.Vector2(ts.width, ts.height);
                }
            }
            return true;
        };
        Sprite2D.prototype._mustUpdateInstance = function () {
            var res = this._oldTextureHasAlpha !== (this.texture != null && this.texture.hasAlpha);
            this._oldTextureHasAlpha = this.texture != null && this.texture.hasAlpha;
            if (res) {
                this._updateRenderMode();
            }
            return res;
        };
        Sprite2D.prototype._useTextureAlpha = function () {
            return this.texture != null && this.texture.hasAlpha;
        };
        Sprite2D.prototype._shouldUseAlphaFromTexture = function () {
            return this.texture != null && this.texture.hasAlpha && this.useAlphaFromTexture;
        };
        Sprite2D.SPRITE2D_MAINPARTID = 1;
        Sprite2D._prop = BABYLON.Vector3.Zero();
        Sprite2D.layoutConstructMode = false;
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Sprite2D.textureProperty = pi; })
        ], Sprite2D.prototype, "texture", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Sprite2D.useAlphaFromTextureProperty = pi; })
        ], Sprite2D.prototype, "useAlphaFromTexture", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, function (pi) { return Sprite2D.actualSizeProperty = pi; }, false, true)
        ], Sprite2D.prototype, "actualSize", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, function (pi) { return Sprite2D.spriteLocationProperty = pi; })
        ], Sprite2D.prototype, "spriteLocation", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, function (pi) { return Sprite2D.spriteFrameProperty = pi; })
        ], Sprite2D.prototype, "spriteFrame", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 6, function (pi) { return Sprite2D.invertYProperty = pi; })
        ], Sprite2D.prototype, "invertY", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 7, function (pi) { return Sprite2D.spriteScaleFactorProperty = pi; })
        ], Sprite2D.prototype, "spriteScaleFactor", null);
        Sprite2D = __decorate([
            BABYLON.className("Sprite2D", "BABYLON")
        ], Sprite2D);
        return Sprite2D;
    }(BABYLON.RenderablePrim2D));
    BABYLON.Sprite2D = Sprite2D;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Text2DRenderCache = (function (_super) {
        __extends(Text2DRenderCache, _super);
        function Text2DRenderCache() {
            _super.apply(this, arguments);
            this.effectsReady = false;
            this.vb = null;
            this.ib = null;
            this.instancingAttributes = null;
            this.fontTexture = null;
            this.effect = null;
            this.effectInstanced = null;
        }
        Text2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            this.fontTexture.update();
            var effect = context.useInstancing ? this.effectInstanced : this.effect;
            engine.enableEffect(effect);
            effect.setTexture("diffuseSampler", this.fontTexture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, effect);
            var curAlphaMode = engine.getAlphaMode();
            engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
            var pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Text2D.TEXT2D_MAINPARTID, effect);
                }
                var glBuffer = context.instancedBuffers ? context.instancedBuffers[0] : pid._partBuffer;
                var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                canvas._addDrawCallCount(1, context.renderMode);
                engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingAttributes);
                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            }
            else {
                canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
                    engine.draw(true, 0, 6);
                }
            }
            engine.setAlphaMode(curAlphaMode, true);
            return true;
        };
        Text2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.vb) {
                this._engine._releaseBuffer(this.vb);
                this.vb = null;
            }
            if (this.ib) {
                this._engine._releaseBuffer(this.ib);
                this.ib = null;
            }
            if (this.fontTexture) {
                this.fontTexture.decCachedFontTextureCounter();
                this.fontTexture = null;
            }
            this.effect = null;
            this.effectInstanced = null;
            return true;
        };
        return Text2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Text2DRenderCache = Text2DRenderCache;
    var Text2DInstanceData = (function (_super) {
        __extends(Text2DInstanceData, _super);
        function Text2DInstanceData(partId, dataElementCount) {
            _super.call(this, partId, dataElementCount);
        }
        Object.defineProperty(Text2DInstanceData.prototype, "topLeftUV", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "sizeUV", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "textureSize", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "color", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "superSampleFactor", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "topLeftUV", null);
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "sizeUV", null);
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "textureSize", null);
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "color", null);
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "superSampleFactor", null);
        return Text2DInstanceData;
    }(BABYLON.InstanceDataBase));
    BABYLON.Text2DInstanceData = Text2DInstanceData;
    var Text2D = (function (_super) {
        __extends(Text2D, _super);
        /**
         * Create a Text primitive
         * @param text the text to display
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fontName: the name/size/style of the font to use, following the CSS notation. Default is "12pt Arial".
         * - fontSuperSample: if true the text will be rendered with a superSampled font (the font is twice the given size). Use this settings if the text lies in world space or if it's scaled in.
         * - defaultFontColor: the color by default to apply on each letter of the text to display, default is plain white.
         * - areaSize: the size of the area in which to display the text, default is auto-fit from text content.
         * - tabulationSize: number of space character to insert when a tabulation is encountered, default is 4
         * - isVisible: true if the text must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Text2D(text, settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            this.fontName = (settings.fontName == null) ? "12pt Arial" : settings.fontName;
            this._fontSuperSample = (settings.fontSuperSample != null && settings.fontSuperSample);
            this.defaultFontColor = (settings.defaultFontColor == null) ? new BABYLON.Color4(1, 1, 1, 1) : settings.defaultFontColor;
            this._tabulationSize = (settings.tabulationSize == null) ? 4 : settings.tabulationSize;
            this._textSize = null;
            this.text = text;
            this.size = (settings.size == null) ? null : settings.size;
            this._updateRenderMode();
        }
        Object.defineProperty(Text2D.prototype, "fontName", {
            get: function () {
                return this._fontName;
            },
            set: function (value) {
                if (this._fontName) {
                    throw new Error("Font Name change is not supported right now.");
                }
                this._fontName = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "defaultFontColor", {
            get: function () {
                return this._defaultFontColor;
            },
            set: function (value) {
                this._defaultFontColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "text", {
            get: function () {
                return this._text;
            },
            set: function (value) {
                if (!value) {
                    value = "";
                }
                this._text = value;
                this._textSize = null; // A change of text will reset the TextSize which will be recomputed next time it's used
                this._size = null;
                this._updateCharCount();
                // Trigger a textSize to for a sizeChange if necessary, which is needed for layout to recompute
                var s = this.textSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "size", {
            get: function () {
                if (this._size != null) {
                    return this._size;
                }
                return this.textSize;
            },
            set: function (value) {
                this._size = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "isSizeAuto", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "actualSize", {
            /**
             * Get the actual size of the Text2D primitive
             */
            get: function () {
                if (this._actualSize) {
                    return this._actualSize;
                }
                return this.size;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "textSize", {
            /**
             * Get the area that bounds the text associated to the primitive
             */
            get: function () {
                if (!this._textSize) {
                    if (this.owner && this._text) {
                        var newSize = this.fontTexture.measureText(this._text, this._tabulationSize);
                        if (!newSize.equals(this._textSize)) {
                            this.onPrimitivePropertyDirty(BABYLON.Prim2DBase.sizeProperty.flagId);
                            this._positioningDirty();
                        }
                        this._textSize = newSize;
                    }
                    else {
                        return Text2D.nullSize;
                    }
                }
                return this._textSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "fontTexture", {
            get: function () {
                if (this._fontTexture) {
                    return this._fontTexture;
                }
                if (this.fontName == null || this.owner == null || this.owner.scene == null) {
                    return null;
                }
                this._fontTexture = BABYLON.FontTexture.GetCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample);
                return this._fontTexture;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Dispose the primitive, remove it from its parent
         */
        Text2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._fontTexture) {
                BABYLON.FontTexture.ReleaseCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample);
                this._fontTexture = null;
            }
            return true;
        };
        Text2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
        };
        Text2D.prototype.levelIntersect = function (intersectInfo) {
            // For now I can't do something better that boundingInfo is a hit, detecting an intersection on a particular letter would be possible, but do we really need it? Not for now...
            return true;
        };
        Text2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Text2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Text2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            renderCache.fontTexture = this.fontTexture;
            renderCache.fontTexture.incCachedFontTextureCounter();
            var vb = new Float32Array(4);
            for (var i = 0; i < 4; i++) {
                vb[i] = i;
            }
            renderCache.vb = engine.createVertexBuffer(vb);
            var ib = new Float32Array(6);
            ib[0] = 0;
            ib[1] = 2;
            ib[2] = 1;
            ib[3] = 0;
            ib[4] = 3;
            ib[5] = 2;
            renderCache.ib = engine.createIndexBuffer(ib);
            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            var ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"], null, true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }
            ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"], null, false);
            renderCache.effect = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            return renderCache;
        };
        Text2D.prototype.createInstanceDataParts = function () {
            return [new Text2DInstanceData(Text2D.TEXT2D_MAINPARTID, this._charCount)];
        };
        // Looks like a hack!? Yes! Because that's what it is!
        // For the InstanceData layer to compute correctly we need to set all the properties involved, which won't be the case if there's no text
        // This method is called before the layout construction for us to detect this case, set some text and return the initial one to restore it after (there can be some text without char to display, say "\t\n" for instance)
        Text2D.prototype.beforeRefreshForLayoutConstruction = function (part) {
            if (!this._charCount) {
                var curText = this._text;
                this.text = "A";
                return curText;
            }
        };
        // if obj contains something, we restore the _text property
        Text2D.prototype.afterRefreshForLayoutConstruction = function (part, obj) {
            if (obj !== undefined) {
                this.text = obj;
            }
        };
        Text2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === Text2D.TEXT2D_MAINPARTID) {
                var d = part;
                var texture = this.fontTexture;
                var superSampleFactor = texture.isSuperSampled ? 0.5 : 1;
                var ts = texture.getSize();
                var offset = BABYLON.Vector2.Zero();
                var lh = this.fontTexture.lineHeight;
                offset.y = ((this.textSize.height / lh) - 1) * lh; // Origin is bottom, not top, so the offset is starting with a y that is the top location of the text
                var charxpos = 0;
                d.dataElementCount = this._charCount;
                d.curElement = 0;
                for (var _i = 0, _a = this.text; _i < _a.length; _i++) {
                    var char = _a[_i];
                    // Line feed
                    if (char === "\n") {
                        offset.x = 0;
                        offset.y -= texture.lineHeight;
                    }
                    // Tabulation ?
                    if (char === "\t") {
                        var nextPos = charxpos + this._tabulationSize;
                        nextPos = nextPos - (nextPos % this._tabulationSize);
                        offset.x += (nextPos - charxpos) * texture.spaceWidth;
                        charxpos = nextPos;
                        continue;
                    }
                    if (char < " ") {
                        continue;
                    }
                    this.updateInstanceDataPart(d, offset);
                    var ci = texture.getChar(char);
                    offset.x += ci.charWidth;
                    d.topLeftUV = ci.topLeftUV;
                    var suv = ci.bottomRightUV.subtract(ci.topLeftUV);
                    d.sizeUV = suv;
                    d.textureSize = new BABYLON.Vector2(ts.width, ts.height);
                    d.color = this.defaultFontColor;
                    d.superSampleFactor = superSampleFactor;
                    ++d.curElement;
                }
            }
            return true;
        };
        Text2D.prototype._updateCharCount = function () {
            var count = 0;
            for (var _i = 0, _a = this._text; _i < _a.length; _i++) {
                var char = _a[_i];
                if (char === "\r" || char === "\n" || char === "\t" || char < " ") {
                    continue;
                }
                ++count;
            }
            this._charCount = count;
        };
        Text2D.prototype._useTextureAlpha = function () {
            return this.fontTexture != null && this.fontTexture.hasAlpha;
        };
        Text2D.prototype._shouldUseAlphaFromTexture = function () {
            return true;
        };
        Text2D.TEXT2D_MAINPARTID = 1;
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Text2D.fontProperty = pi; }, false, true)
        ], Text2D.prototype, "fontName", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Text2D.defaultFontColorProperty = pi; })
        ], Text2D.prototype, "defaultFontColor", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, function (pi) { return Text2D.textProperty = pi; }, false, true)
        ], Text2D.prototype, "text", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, function (pi) { return Text2D.sizeProperty = pi; })
        ], Text2D.prototype, "size", null);
        Text2D = __decorate([
            BABYLON.className("Text2D", "BABYLON")
        ], Text2D);
        return Text2D;
    }(BABYLON.RenderablePrim2D));
    BABYLON.Text2D = Text2D;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Lines2DRenderCache = (function (_super) {
        __extends(Lines2DRenderCache, _super);
        function Lines2DRenderCache(engine, modelKey) {
            _super.call(this, engine, modelKey);
            this.effectsReady = false;
            this.fillVB = null;
            this.fillIB = null;
            this.fillIndicesCount = 0;
            this.instancingFillAttributes = null;
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.borderVB = null;
            this.borderIB = null;
            this.borderIndicesCount = 0;
            this.instancingBorderAttributes = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
        }
        Lines2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effectFill && (!this.effectFill.isReady() || (this.effectFillInstanced && !this.effectFillInstanced.isReady()))) ||
                    (this.effectBorder && (!this.effectBorder.isReady() || (this.effectBorderInstanced && !this.effectBorderInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }
            var curAlphaMode = engine.getAlphaMode();
            if (this.effectFill) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_FILLPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [2], 2 * 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.fillIndicesCount);
                    }
                }
            }
            if (this.effectBorder) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_BORDERPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [2], 2 * 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }
            engine.setAlphaMode(curAlphaMode, true);
            if (this.effectFill && this.effectBorder) {
                engine.setDepthFunction(depthFunction);
            }
            return true;
        };
        Lines2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.fillVB) {
                this._engine._releaseBuffer(this.fillVB);
                this.fillVB = null;
            }
            if (this.fillIB) {
                this._engine._releaseBuffer(this.fillIB);
                this.fillIB = null;
            }
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
            if (this.borderVB) {
                this._engine._releaseBuffer(this.borderVB);
                this.borderVB = null;
            }
            if (this.borderIB) {
                this._engine._releaseBuffer(this.borderIB);
                this.borderIB = null;
            }
            return true;
        };
        return Lines2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Lines2DRenderCache = Lines2DRenderCache;
    var Lines2DInstanceData = (function (_super) {
        __extends(Lines2DInstanceData, _super);
        function Lines2DInstanceData(partId) {
            _super.call(this, partId, 1);
        }
        Object.defineProperty(Lines2DInstanceData.prototype, "boundingMin", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2DInstanceData.prototype, "boundingMax", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData(BABYLON.Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        ], Lines2DInstanceData.prototype, "boundingMin", null);
        __decorate([
            BABYLON.instanceData(BABYLON.Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        ], Lines2DInstanceData.prototype, "boundingMax", null);
        return Lines2DInstanceData;
    }(BABYLON.Shape2DInstanceData));
    BABYLON.Lines2DInstanceData = Lines2DInstanceData;
    var Lines2D = (function (_super) {
        __extends(Lines2D, _super);
        /**
         * Create an 2D Lines Shape primitive. The defined lines may be opened or closed (see below)
         * @param points an array that describe the points to use to draw the line, must contain at least two entries.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fillThickness: the thickness of the fill part of the line, can be null to draw nothing (but a border brush must be given), default is 1.
         * - closed: if false the lines are said to be opened, the first point and the latest DON'T connect. if true the lines are said to be closed, the first and last point will be connected by a line. For instance you can define the 4 points of a rectangle, if you set closed to true a 4 edges rectangle will be drawn. If you set false, only three edges will be drawn, the edge formed by the first and last point won't exist. Default is false.
         * - startCap: Draw a cap of the given type at the start of the first line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         * - endCap: Draw a cap of the given type at the end of the last line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         * - fill: the brush used to draw the fill content of the lines, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the lines, you can set null to draw nothing (but you will have to set a fill brush), default is null. can be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the primitive must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Lines2D(points, settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            this._fillVB = null;
            this._fillIB = null;
            this._borderVB = null;
            this._borderIB = null;
            this._size = BABYLON.Size.Zero();
            this._boundingMin = null;
            this._boundingMax = null;
            var fillThickness = (settings.fillThickness == null) ? 1 : settings.fillThickness;
            var startCap = (settings.startCap == null) ? 0 : settings.startCap;
            var endCap = (settings.endCap == null) ? 0 : settings.endCap;
            var closed = (settings.closed == null) ? false : settings.closed;
            this.points = points;
            this.fillThickness = fillThickness;
            this.startCap = startCap;
            this.endCap = endCap;
            this.closed = closed;
        }
        Object.defineProperty(Lines2D, "NoCap", {
            /**
             * No Cap to apply on the extremity
             */
            get: function () { return Lines2D._noCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "RoundCap", {
            /**
             * A round cap, will use the line thickness as diameter
             */
            get: function () { return Lines2D._roundCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "TriangleCap", {
            /**
             * Creates a triangle at the extremity.
             */
            get: function () { return Lines2D._triangleCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "SquareAnchorCap", {
            /**
             * Creates a Square anchor at the extremity, the square size is twice the thickness of the line
             */
            get: function () { return Lines2D._squareAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "RoundAnchorCap", {
            /**
             * Creates a round anchor at the extremity, the diameter is twice the thickness of the line
             */
            get: function () { return Lines2D._roundAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "DiamondAnchorCap", {
            /**
             * Creates a diamond anchor at the extremity.
             */
            get: function () { return Lines2D._diamondAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "ArrowCap", {
            /**
             * Creates an arrow anchor at the extremity. the arrow base size is twice the thickness of the line
             */
            get: function () { return Lines2D._arrowCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "points", {
            get: function () {
                return this._points;
            },
            set: function (value) {
                this._points = value;
                this._contour = null;
                this._boundingBoxDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "fillThickness", {
            get: function () {
                return this._fillThickness;
            },
            set: function (value) {
                this._fillThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "closed", {
            get: function () {
                return this._closed;
            },
            set: function (value) {
                this._closed = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "startCap", {
            get: function () {
                return this._startCap;
            },
            set: function (value) {
                this._startCap = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "endCap", {
            get: function () {
                return this._endCap;
            },
            set: function (value) {
                this._endCap = value;
            },
            enumerable: true,
            configurable: true
        });
        Lines2D.prototype.levelIntersect = function (intersectInfo) {
            var _this = this;
            if (this._contour == null) {
                this._computeLines2D();
            }
            var pl = this.points.length;
            var l = this.closed ? pl + 1 : pl;
            var p = intersectInfo._localPickPosition;
            this.transformPointWithOriginToRef(this._contour[0], null, Lines2D._prevA);
            this.transformPointWithOriginToRef(this._contour[1], null, Lines2D._prevB);
            for (var i = 1; i < l; i++) {
                this.transformPointWithOriginToRef(this._contour[(i % pl) * 2 + 0], null, Lines2D._curA);
                this.transformPointWithOriginToRef(this._contour[(i % pl) * 2 + 1], null, Lines2D._curB);
                if (BABYLON.Vector2.PointInTriangle(p, Lines2D._prevA, Lines2D._prevB, Lines2D._curA)) {
                    return true;
                }
                if (BABYLON.Vector2.PointInTriangle(p, Lines2D._curA, Lines2D._prevB, Lines2D._curB)) {
                    return true;
                }
                Lines2D._prevA.x = Lines2D._curA.x;
                Lines2D._prevA.y = Lines2D._curA.y;
                Lines2D._prevB.x = Lines2D._curB.x;
                Lines2D._prevB.y = Lines2D._curB.y;
            }
            var capIntersect = function (tri, points) {
                var l = tri.length;
                for (var i = 0; i < l; i += 3) {
                    Lines2D._curA.x = points[tri[i + 0] * 2 + 0];
                    Lines2D._curA.y = points[tri[i + 0] * 2 + 1];
                    _this.transformPointWithOriginToRef(Lines2D._curA, null, Lines2D._curB);
                    Lines2D._curA.x = points[tri[i + 1] * 2 + 0];
                    Lines2D._curA.y = points[tri[i + 1] * 2 + 1];
                    _this.transformPointWithOriginToRef(Lines2D._curA, null, Lines2D._prevA);
                    Lines2D._curA.x = points[tri[i + 2] * 2 + 0];
                    Lines2D._curA.y = points[tri[i + 2] * 2 + 1];
                    _this.transformPointWithOriginToRef(Lines2D._curA, null, Lines2D._prevB);
                    if (BABYLON.Vector2.PointInTriangle(p, Lines2D._prevA, Lines2D._prevB, Lines2D._curB)) {
                        return true;
                    }
                }
                return false;
            };
            if (this._startCapTriIndices) {
                if (this._startCapTriIndices && capIntersect(this._startCapTriIndices, this._startCapContour)) {
                    return true;
                }
                if (this._endCapTriIndices && capIntersect(this._endCapTriIndices, this._endCapContour)) {
                    return true;
                }
            }
            return false;
        };
        Object.defineProperty(Lines2D.prototype, "boundingMin", {
            get: function () {
                if (!this._boundingMin) {
                    this._computeLines2D();
                }
                return this._boundingMin;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "boundingMax", {
            get: function () {
                if (!this._boundingMax) {
                    this._computeLines2D();
                }
                return this._boundingMax;
            },
            enumerable: true,
            configurable: true
        });
        Lines2D.prototype.getUsedShaderCategories = function (dataPart) {
            var res = _super.prototype.getUsedShaderCategories.call(this, dataPart);
            // Remove the BORDER category, we don't use it in the VertexShader
            var i = res.indexOf(BABYLON.Shape2D.SHAPE2D_CATEGORY_BORDER);
            if (i !== -1) {
                res.splice(i, 1);
            }
            return res;
        };
        Lines2D.prototype.updateLevelBoundingInfo = function () {
            if (!this._boundingMin) {
                this._computeLines2D();
            }
            BABYLON.BoundingInfo2D.CreateFromMinMaxToRef(this._boundingMin.x, this._boundingMax.x, this._boundingMin.y, this._boundingMax.y, this._levelBoundingInfo);
        };
        Lines2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Lines2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        ///////////////////////////////////////////////////////////////////////////////////
        // Methods for Lines building
        Lines2D.prototype._perp = function (v, res) {
            res.x = v.y;
            res.y = -v.x;
        };
        ;
        Lines2D.prototype._direction = function (a, b, res) {
            a.subtractToRef(b, res);
            res.normalize();
        };
        Lines2D.prototype._computeMiter = function (tangent, miter, a, b) {
            a.addToRef(b, tangent);
            tangent.normalize();
            miter.x = -tangent.y;
            miter.y = tangent.x;
            Lines2D._miterTps.x = -a.y;
            Lines2D._miterTps.y = a.x;
            return 1 / BABYLON.Vector2.Dot(miter, Lines2D._miterTps);
        };
        Lines2D.prototype._intersect = function (x1, y1, x2, y2, x3, y3, x4, y4) {
            var d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (d === 0)
                return false;
            var xi = ((x3 - x4) * (x1 * y2 - y1 * x2) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d; // Intersection point is xi/yi, just in case...
            //let yi = ((y3 - y4) * (x1 * y2 - y1 * x2) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d; // That's why I left it commented
            if (xi < Math.min(x1, x2) || xi > Math.max(x1, x2))
                return false;
            if (xi < Math.min(x3, x4) || xi > Math.max(x3, x4))
                return false;
            return true;
        };
        Lines2D.prototype._updateMinMax = function (array, offset) {
            if (offset >= array.length) {
                return;
            }
            this._boundingMin.x = Math.min(this._boundingMin.x, array[offset]);
            this._boundingMax.x = Math.max(this._boundingMax.x, array[offset]);
            this._boundingMin.y = Math.min(this._boundingMin.y, array[offset + 1]);
            this._boundingMax.y = Math.max(this._boundingMax.y, array[offset + 1]);
        };
        Lines2D.prototype._store = function (array, contour, index, max, p, n, halfThickness, borderThickness, detectFlip) {
            var borderMode = borderThickness != null && !isNaN(borderThickness);
            var off = index * (borderMode ? 8 : 4);
            // Mandatory because we'll be out of bound in case of closed line, for the very last point (which is a duplicate of the first that we don't store in the vb)
            if (off >= array.length) {
                return;
            }
            // Store start/end normal, we need it for the cap construction
            if (index === 0) {
                this._perp(n, Lines2D._startDir);
            }
            else if (index === max - 1) {
                this._perp(n, Lines2D._endDir);
                Lines2D._endDir.x *= -1;
                Lines2D._endDir.y *= -1;
            }
            var swap = false;
            array[off + 0] = p.x + n.x * halfThickness;
            array[off + 1] = p.y + n.y * halfThickness;
            array[off + 2] = p.x + n.x * -halfThickness;
            array[off + 3] = p.y + n.y * -halfThickness;
            this._updateMinMax(array, off);
            this._updateMinMax(array, off + 2);
            // If an index is given we check if the two segments formed between [index+0;detectFlip+0] and [index+2;detectFlip+2] intersect themselves.
            // It should not be the case, they should be parallel, so if they cross, we switch the order of storage to ensure we'll have parallel lines
            if (detectFlip !== undefined) {
                // Flip if intersect
                var flipOff = detectFlip * (borderMode ? 8 : 4);
                if (this._intersect(array[off + 0], array[off + 1], array[flipOff + 0], array[flipOff + 1], array[off + 2], array[off + 3], array[flipOff + 2], array[flipOff + 3])) {
                    swap = true;
                    var tps = array[off + 0];
                    array[off + 0] = array[off + 2];
                    array[off + 2] = tps;
                    tps = array[off + 1];
                    array[off + 1] = array[off + 3];
                    array[off + 3] = tps;
                }
            }
            if (borderMode) {
                var t = halfThickness + borderThickness;
                array[off + 4] = p.x + n.x * (swap ? -t : t);
                array[off + 5] = p.y + n.y * (swap ? -t : t);
                array[off + 6] = p.x + n.x * (swap ? t : -t);
                array[off + 7] = p.y + n.y * (swap ? t : -t);
                this._updateMinMax(array, off + 4);
                this._updateMinMax(array, off + 6);
            }
            if (contour) {
                off += borderMode ? 4 : 0;
                contour.push(new BABYLON.Vector2(array[off + 0], array[off + 1]));
                contour.push(new BABYLON.Vector2(array[off + 2], array[off + 3]));
            }
        };
        Lines2D.prototype._getCapSize = function (type, border) {
            if (border === void 0) { border = false; }
            var sd = Lines2D._roundCapSubDiv;
            // If no array given, we call this to get the size
            var vbsize = 0, ibsize = 0;
            switch (type) {
                case Lines2D.NoCap:
                    {
                        // If the line is not close and we're computing border, we add the size to generate the edge border
                        if (!this.closed && border) {
                            vbsize = 4;
                            ibsize = 6;
                        }
                        else {
                            vbsize = ibsize = 0;
                        }
                        break;
                    }
                case Lines2D.RoundCap:
                    {
                        if (border) {
                            vbsize = sd;
                            ibsize = (sd - 2) * 3;
                        }
                        else {
                            vbsize = (sd / 2) + 1;
                            ibsize = (sd / 2) * 3;
                        }
                        break;
                    }
                case Lines2D.ArrowCap:
                    {
                        if (border) {
                            vbsize = 12;
                            ibsize = 24;
                        }
                        else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    }
                case Lines2D.TriangleCap:
                    {
                        if (border) {
                            vbsize = 6;
                            ibsize = 12;
                        }
                        else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    }
                case Lines2D.DiamondAnchorCap:
                    {
                        if (border) {
                            vbsize = 10;
                            ibsize = 24;
                        }
                        else {
                            vbsize = 5;
                            ibsize = 9;
                        }
                        break;
                    }
                case Lines2D.SquareAnchorCap:
                    {
                        if (border) {
                            vbsize = 12;
                            ibsize = 30;
                        }
                        else {
                            vbsize = 4;
                            ibsize = 6;
                        }
                        break;
                    }
                case Lines2D.RoundAnchorCap:
                    {
                        if (border) {
                            vbsize = sd * 2;
                            ibsize = (sd - 1) * 6;
                        }
                        else {
                            vbsize = sd + 1;
                            ibsize = (sd + 1) * 3;
                        }
                        break;
                    }
            }
            return { vbsize: vbsize * 2, ibsize: ibsize };
        };
        Lines2D.prototype._storeVertex = function (vb, baseOffset, index, basePos, rotation, vertex, contour) {
            var c = Math.cos(rotation);
            var s = Math.sin(rotation);
            Lines2D._tpsV.x = (c * vertex.x) + (-s * vertex.y) + basePos.x;
            Lines2D._tpsV.y = (s * vertex.x) + (c * vertex.y) + basePos.y;
            var offset = baseOffset + (index * 2);
            vb[offset + 0] = Lines2D._tpsV.x;
            vb[offset + 1] = Lines2D._tpsV.y;
            if (contour) {
                contour.push(Lines2D._tpsV.x);
                contour.push(Lines2D._tpsV.y);
            }
            this._updateMinMax(vb, offset);
            return (baseOffset + index * 2) / 2;
        };
        Lines2D.prototype._storeIndex = function (ib, baseOffset, index, vertexIndex) {
            ib[baseOffset + index] = vertexIndex;
        };
        Lines2D.prototype._buildCap = function (vb, vbi, ib, ibi, pos, thickness, borderThickness, type, capDir, contour) {
            // Compute the transformation from the direction of the cap to build relative to our default orientation [1;0] (our cap are by default pointing toward right, horizontal
            var sd = Lines2D._roundCapSubDiv;
            var dir = new BABYLON.Vector2(1, 0);
            var angle = Math.atan2(capDir.y, capDir.x) - Math.atan2(dir.y, dir.x);
            var ht = thickness / 2;
            var t = thickness;
            var borderMode = borderThickness != null;
            var bt = borderThickness;
            switch (type) {
                case Lines2D.NoCap:
                    if (borderMode && !this.closed) {
                        var vi = 0;
                        var ii = 0;
                        var v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht + bt), contour);
                        var v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(bt, ht + bt), contour);
                        var v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(bt, -(ht + bt)), contour);
                        var v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -(ht + bt)), contour);
                        this._storeIndex(ib, ibi, ii++, v1);
                        this._storeIndex(ib, ibi, ii++, v2);
                        this._storeIndex(ib, ibi, ii++, v3);
                        this._storeIndex(ib, ibi, ii++, v1);
                        this._storeIndex(ib, ibi, ii++, v3);
                        this._storeIndex(ib, ibi, ii++, v4);
                    }
                    break;
                case Lines2D.ArrowCap:
                    ht *= 2;
                case Lines2D.TriangleCap:
                    {
                        if (borderMode) {
                            var f = type === Lines2D.TriangleCap ? bt : Math.sqrt(bt * bt * 2);
                            var v1 = this._storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, ht), null);
                            var v2 = this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(ht, 0), null);
                            var v3 = this._storeVertex(vb, vbi, 2, pos, angle, new BABYLON.Vector2(0, -ht), null);
                            var v4 = this._storeVertex(vb, vbi, 3, pos, angle, new BABYLON.Vector2(0, ht + f), contour);
                            var v5 = this._storeVertex(vb, vbi, 4, pos, angle, new BABYLON.Vector2(ht + f, 0), contour);
                            var v6 = this._storeVertex(vb, vbi, 5, pos, angle, new BABYLON.Vector2(0, -(ht + f)), contour);
                            var ii = 0;
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v5);
                            if (type === Lines2D.ArrowCap) {
                                var rht = thickness / 2;
                                var v10 = this._storeVertex(vb, vbi, 9, pos, angle, new BABYLON.Vector2(0, -(rht + bt)), null);
                                var v12 = this._storeVertex(vb, vbi, 11, pos, angle, new BABYLON.Vector2(-bt, -(ht + f)), contour);
                                var v11 = this._storeVertex(vb, vbi, 10, pos, angle, new BABYLON.Vector2(-bt, -(rht + bt)), contour);
                                var v7 = this._storeVertex(vb, vbi, 6, pos, angle, new BABYLON.Vector2(0, rht + bt), null);
                                var v8 = this._storeVertex(vb, vbi, 7, pos, angle, new BABYLON.Vector2(-bt, rht + bt), contour);
                                var v9 = this._storeVertex(vb, vbi, 8, pos, angle, new BABYLON.Vector2(-bt, ht + f), contour);
                                this._storeIndex(ib, ibi, ii++, v7);
                                this._storeIndex(ib, ibi, ii++, v8);
                                this._storeIndex(ib, ibi, ii++, v9);
                                this._storeIndex(ib, ibi, ii++, v7);
                                this._storeIndex(ib, ibi, ii++, v9);
                                this._storeIndex(ib, ibi, ii++, v4);
                                this._storeIndex(ib, ibi, ii++, v10);
                                this._storeIndex(ib, ibi, ii++, v12);
                                this._storeIndex(ib, ibi, ii++, v11);
                                this._storeIndex(ib, ibi, ii++, v10);
                                this._storeIndex(ib, ibi, ii++, v6);
                                this._storeIndex(ib, ibi, ii++, v12);
                            }
                        }
                        else {
                            var v1 = this._storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, ht), contour);
                            var v2 = this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(ht, 0), contour);
                            var v3 = this._storeVertex(vb, vbi, 2, pos, angle, new BABYLON.Vector2(0, -ht), contour);
                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                        }
                        break;
                    }
                case Lines2D.RoundCap:
                    {
                        if (borderMode) {
                            var curA = -Math.PI / 2;
                            var incA = Math.PI / (sd / 2 - 1);
                            var ii = 0;
                            for (var i = 0; i < (sd / 2); i++) {
                                var v1 = this._storeVertex(vb, vbi, i * 2 + 0, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                                var v2 = this._storeVertex(vb, vbi, i * 2 + 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * (ht + bt), Math.sin(curA) * (ht + bt)), contour);
                                if (i > 0) {
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1);
                                }
                                curA += incA;
                            }
                        }
                        else {
                            var c = this._storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, 0), null);
                            var curA = -Math.PI / 2;
                            var incA = Math.PI / (sd / 2 - 1);
                            this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                            curA += incA;
                            for (var i = 1; i < (sd / 2); i++) {
                                var v2 = this._storeVertex(vb, vbi, i + 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), contour);
                                this._storeIndex(ib, ibi, i * 3 + 0, c);
                                this._storeIndex(ib, ibi, i * 3 + 1, v2 - 1);
                                this._storeIndex(ib, ibi, i * 3 + 2, v2);
                                curA += incA;
                            }
                        }
                        break;
                    }
                case Lines2D.SquareAnchorCap:
                    {
                        var vi = 0;
                        var c = borderMode ? null : contour;
                        var v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, t), c);
                        var v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2, t), c);
                        var v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2, -t), c);
                        var v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -t), c);
                        if (borderMode) {
                            var v5 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht + bt), null);
                            var v6 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, ht + bt), contour);
                            var v7 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, t + bt), contour);
                            var v8 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2 + bt, t + bt), contour);
                            var v9 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2 + bt, -(t + bt)), contour);
                            var v10 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, -(t + bt)), contour);
                            var v11 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, -(ht + bt)), contour);
                            var v12 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -(ht + bt)), null);
                            var ii = 0;
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v11);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v11);
                            this._storeIndex(ib, ibi, ii++, v12);
                            this._storeIndex(ib, ibi, ii++, v4);
                        }
                        else {
                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                            this._storeIndex(ib, ibi, 3, v1);
                            this._storeIndex(ib, ibi, 4, v3);
                            this._storeIndex(ib, ibi, 5, v4);
                        }
                        break;
                    }
                case Lines2D.RoundAnchorCap:
                    {
                        var cpos = Math.sqrt(t * t - ht * ht);
                        var center = new BABYLON.Vector2(cpos, 0);
                        var curA = BABYLON.Tools.ToRadians(-150);
                        var incA = BABYLON.Tools.ToRadians(300) / (sd - 1);
                        if (borderMode) {
                            var ii = 0;
                            for (var i = 0; i < sd; i++) {
                                var v1 = this._storeVertex(vb, vbi, i * 2 + 0, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null);
                                var v2 = this._storeVertex(vb, vbi, i * 2 + 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * (t + bt), Math.sin(curA) * (t + bt)), contour);
                                if (i > 0) {
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1);
                                }
                                curA += incA;
                            }
                        }
                        else {
                            var c = this._storeVertex(vb, vbi, 0, pos, angle, center, null);
                            this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null);
                            curA += incA;
                            for (var i = 1; i < sd; i++) {
                                var v2 = this._storeVertex(vb, vbi, i + 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), contour);
                                this._storeIndex(ib, ibi, i * 3 + 0, c);
                                this._storeIndex(ib, ibi, i * 3 + 1, v2 - 1);
                                this._storeIndex(ib, ibi, i * 3 + 2, v2);
                                curA += incA;
                            }
                            this._storeIndex(ib, ibi, sd * 3 + 0, c);
                            this._storeIndex(ib, ibi, sd * 3 + 1, c + 1);
                            this._storeIndex(ib, ibi, sd * 3 + 2, c + sd);
                        }
                        break;
                    }
                case Lines2D.DiamondAnchorCap:
                    {
                        var vi = 0;
                        var c = borderMode ? null : contour;
                        var v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht), c);
                        var v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, t), c);
                        var v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht * 3, 0), c);
                        var v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, -t), c);
                        var v5 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -ht), c);
                        if (borderMode) {
                            var f = Math.sqrt(bt * bt * 2);
                            var v6 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-f, ht), contour);
                            var v7 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, t + f), contour);
                            var v8 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht * 3 + f, 0), contour);
                            var v9 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, -(t + f)), contour);
                            var v10 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-f, -ht), contour);
                            var ii = 0;
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v5);
                        }
                        else {
                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                            this._storeIndex(ib, ibi, 3, v1);
                            this._storeIndex(ib, ibi, 4, v3);
                            this._storeIndex(ib, ibi, 5, v5);
                            this._storeIndex(ib, ibi, 6, v5);
                            this._storeIndex(ib, ibi, 7, v3);
                            this._storeIndex(ib, ibi, 8, v4);
                        }
                        break;
                    }
            }
            return null;
        };
        Lines2D.prototype._buildLine = function (vb, contour, ht, bt) {
            var lineA = BABYLON.Vector2.Zero();
            var lineB = BABYLON.Vector2.Zero();
            var tangent = BABYLON.Vector2.Zero();
            var miter = BABYLON.Vector2.Zero();
            var curNormal = null;
            if (this.closed) {
                this.points.push(this.points[0]);
            }
            var total = this.points.length;
            for (var i = 1; i < total; i++) {
                var last = this.points[i - 1];
                var cur = this.points[i];
                var next = (i < (this.points.length - 1)) ? this.points[i + 1] : null;
                this._direction(cur, last, lineA);
                if (!curNormal) {
                    curNormal = BABYLON.Vector2.Zero();
                    this._perp(lineA, curNormal);
                }
                if (i === 1) {
                    this._store(vb, contour, 0, total, this.points[0], curNormal, ht, bt);
                }
                if (!next) {
                    this._perp(lineA, curNormal);
                    this._store(vb, contour, i, total, this.points[i], curNormal, ht, bt, i - 1);
                }
                else {
                    this._direction(next, cur, lineB);
                    var miterLen = this._computeMiter(tangent, miter, lineA, lineB);
                    this._store(vb, contour, i, total, this.points[i], miter, miterLen * ht, miterLen * bt, i - 1);
                }
            }
            if (this.points.length > 2 && this.closed) {
                var last2 = this.points[total - 2];
                var cur2 = this.points[0];
                var next2 = this.points[1];
                this._direction(cur2, last2, lineA);
                this._direction(next2, cur2, lineB);
                this._perp(lineA, curNormal);
                var miterLen2 = this._computeMiter(tangent, miter, lineA, lineB);
                this._store(vb, null, 0, total, this.points[0], miter, miterLen2 * ht, miterLen2 * bt, 1);
                // Patch contour
                if (contour) {
                    var off = (bt == null) ? 0 : 4;
                    contour[0].x = vb[off + 0];
                    contour[0].y = vb[off + 1];
                    contour[1].x = vb[off + 2];
                    contour[1].y = vb[off + 3];
                }
            }
            // Remove the point we added at the beginning
            if (this.closed) {
                this.points.splice(total - 1);
            }
        };
        // Methods for Lines building
        ///////////////////////////////////////////////////////////////////////////////////
        Lines2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            if (this._fillVB === null) {
                this._computeLines2D();
            }
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                renderCache.fillVB = engine.createVertexBuffer(this._fillVB);
                renderCache.fillIB = engine.createIndexBuffer(this._fillIB);
                renderCache.fillIndicesCount = this._fillIB.length;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["position"], null, true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["position"], null, false);
                renderCache.effectFill = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            // Need to create WebGL resources for border part?
            if (this.border) {
                renderCache.borderVB = engine.createVertexBuffer(this._borderVB);
                renderCache.borderIB = engine.createIndexBuffer(this._borderIB);
                renderCache.borderIndicesCount = this._borderIB.length;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["position"], null, true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["position"], null, false);
                renderCache.effectBorder = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            this._fillVB = null;
            this._fillIB = null;
            this._borderVB = null;
            this._borderIB = null;
            return renderCache;
        };
        Lines2D.prototype._computeLines2D = function () {
            // Init min/max because their being computed here
            this._boundingMin = new BABYLON.Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
            this._boundingMax = new BABYLON.Vector2(Number.MIN_VALUE, Number.MIN_VALUE);
            var contour = new Array();
            var startCapContour = new Array();
            var endCapContour = new Array();
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var startCapInfo = this._getCapSize(this.startCap);
                var endCapInfo = this._getCapSize(this.endCap);
                var count = this.points.length;
                var vbSize = (count * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                this._fillVB = new Float32Array(vbSize);
                var vb = this._fillVB;
                var ht = this.fillThickness / 2;
                var total = this.points.length;
                this._buildLine(vb, this.border ? null : contour, ht);
                var max = total * 2;
                var triCount = (count - (this.closed ? 0 : 1)) * 2;
                this._fillIB = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                var ib = this._fillIB;
                for (var i = 0; i < triCount; i += 2) {
                    ib[i * 3 + 0] = i + 0;
                    ib[i * 3 + 1] = i + 1;
                    ib[i * 3 + 2] = (i + 2) % max;
                    ib[i * 3 + 3] = i + 1;
                    ib[i * 3 + 4] = (i + 3) % max;
                    ib[i * 3 + 5] = (i + 2) % max;
                }
                this._buildCap(vb, count * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, null, this.startCap, Lines2D._startDir, this.border ? null : startCapContour);
                this._buildCap(vb, (count * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, null, this.endCap, Lines2D._endDir, this.border ? null : startCapContour);
            }
            // Need to create WebGL resources for border part?
            if (this.border) {
                var startCapInfo = this._getCapSize(this.startCap, true);
                var endCapInfo = this._getCapSize(this.endCap, true);
                var count = this.points.length;
                var vbSize = (count * 2 * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                this._borderVB = new Float32Array(vbSize);
                var vb = this._borderVB;
                var ht = this.fillThickness / 2;
                var bt = this.borderThickness;
                var total = this.points.length;
                this._buildLine(vb, contour, ht, bt);
                var max = total * 2 * 2;
                var triCount = (count - (this.closed ? 0 : 1)) * 2 * 2;
                this._borderIB = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                var ib = this._borderIB;
                for (var i = 0; i < triCount; i += 4) {
                    ib[i * 3 + 0] = i + 0;
                    ib[i * 3 + 1] = i + 2;
                    ib[i * 3 + 2] = (i + 6) % max;
                    ib[i * 3 + 3] = i + 0;
                    ib[i * 3 + 4] = (i + 6) % max;
                    ib[i * 3 + 5] = (i + 4) % max;
                    ib[i * 3 + 6] = i + 3;
                    ib[i * 3 + 7] = i + 1;
                    ib[i * 3 + 8] = (i + 5) % max;
                    ib[i * 3 + 9] = i + 3;
                    ib[i * 3 + 10] = (i + 5) % max;
                    ib[i * 3 + 11] = (i + 7) % max;
                }
                this._buildCap(vb, count * 2 * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, this.borderThickness, this.startCap, Lines2D._startDir, startCapContour);
                this._buildCap(vb, (count * 2 * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, this.borderThickness, this.endCap, Lines2D._endDir, endCapContour);
            }
            this._contour = contour;
            if (startCapContour.length > 0) {
                var startCapTri = Earcut.earcut(startCapContour, null, 2);
                this._startCapTriIndices = startCapTri;
                this._startCapContour = startCapContour;
            }
            else {
                this._startCapTriIndices = null;
                this._startCapContour = null;
            }
            if (endCapContour.length > 0) {
                var endCapTri = Earcut.earcut(endCapContour, null, 2);
                this._endCapContour = endCapContour;
                this._endCapTriIndices = endCapTri;
            }
            else {
                this._endCapContour = null;
                this._endCapTriIndices = null;
            }
            var bs = this._boundingMax.subtract(this._boundingMin);
            this._size.width = bs.x;
            this._size.height = bs.y;
        };
        Object.defineProperty(Lines2D.prototype, "size", {
            get: function () {
                if (this._size == null) {
                    this._computeLines2D();
                }
                return this._size;
            },
            enumerable: true,
            configurable: true
        });
        Lines2D.prototype.createInstanceDataParts = function () {
            var res = new Array();
            if (this.border) {
                res.push(new Lines2DInstanceData(BABYLON.Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Lines2DInstanceData(BABYLON.Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        };
        Lines2D.prototype.applyActualScaleOnTransform = function () {
            return true;
        };
        Lines2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === BABYLON.Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                if (this.border instanceof BABYLON.GradientColorBrush2D) {
                    d.boundingMin = this.boundingMin;
                    d.boundingMax = this.boundingMax;
                }
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                if (this.fill instanceof BABYLON.GradientColorBrush2D) {
                    d.boundingMin = this.boundingMin;
                    d.boundingMax = this.boundingMax;
                }
            }
            return true;
        };
        Lines2D._prevA = BABYLON.Vector2.Zero();
        Lines2D._prevB = BABYLON.Vector2.Zero();
        Lines2D._curA = BABYLON.Vector2.Zero();
        Lines2D._curB = BABYLON.Vector2.Zero();
        Lines2D._miterTps = BABYLON.Vector2.Zero();
        Lines2D._startDir = BABYLON.Vector2.Zero();
        Lines2D._endDir = BABYLON.Vector2.Zero();
        Lines2D._tpsV = BABYLON.Vector2.Zero();
        Lines2D._noCap = 0;
        Lines2D._roundCap = 1;
        Lines2D._triangleCap = 2;
        Lines2D._squareAnchorCap = 3;
        Lines2D._roundAnchorCap = 4;
        Lines2D._diamondAnchorCap = 5;
        Lines2D._arrowCap = 6;
        Lines2D._roundCapSubDiv = 36;
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 1, function (pi) { return Lines2D.pointsProperty = pi; })
        ], Lines2D.prototype, "points", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Lines2D.fillThicknessProperty = pi; })
        ], Lines2D.prototype, "fillThickness", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 3, function (pi) { return Lines2D.closedProperty = pi; })
        ], Lines2D.prototype, "closed", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 4, function (pi) { return Lines2D.startCapProperty = pi; })
        ], Lines2D.prototype, "startCap", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 5, function (pi) { return Lines2D.endCapProperty = pi; })
        ], Lines2D.prototype, "endCap", null);
        Lines2D = __decorate([
            BABYLON.className("Lines2D", "BABYLON")
        ], Lines2D);
        return Lines2D;
    }(BABYLON.Shape2D));
    BABYLON.Lines2D = Lines2D;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    // This class contains data that lifetime is bounding to the Babylon Engine object
    var Canvas2DEngineBoundData = (function () {
        function Canvas2DEngineBoundData() {
            this._modelCache = new BABYLON.StringDictionary();
        }
        Canvas2DEngineBoundData.prototype.GetOrAddModelCache = function (key, factory) {
            return this._modelCache.getOrAddWithFactory(key, factory);
        };
        Canvas2DEngineBoundData.prototype.DisposeModelRenderCache = function (modelRenderCache) {
            if (!modelRenderCache.isDisposed) {
                return false;
            }
            this._modelCache.remove(modelRenderCache.modelKey);
            return true;
        };
        return Canvas2DEngineBoundData;
    }());
    BABYLON.Canvas2DEngineBoundData = Canvas2DEngineBoundData;
    var Canvas2D = (function (_super) {
        __extends(Canvas2D, _super);
        function Canvas2D(scene, settings) {
            var _this = this;
            _super.call(this, settings);
            /**
             * If you set your own WorldSpaceNode to display the Canvas2D you have to provide your own implementation of this method which computes the local position in the Canvas based on the given 3D World one.
             * Beware that you have to take under consideration the origin in your calculations! Good luck!
             */
            this.worldSpaceToNodeLocal = function (worldPos) {
                var node = _this._worldSpaceNode;
                if (!node) {
                    return;
                }
                var mtx = node.getWorldMatrix().clone();
                mtx.invert();
                var v = BABYLON.Vector3.TransformCoordinates(worldPos, mtx);
                var res = new BABYLON.Vector2(v.x, v.y);
                var size = _this.actualSize;
                res.x += size.width * 0.5; // res is centered, make it relative to bottom/left
                res.y += size.height * 0.5;
                return res;
            };
            /**
             * If you use a custom WorldSpaceCanvasNode you have to override this property to update the UV of your object to reflect the changes due to a resizing of the cached bitmap
             */
            this.worldSpaceCacheChanged = function () {
                var plane = _this.worldSpaceCanvasNode;
                var vd = BABYLON.VertexData.ExtractFromMesh(plane); //new VertexData();
                vd.uvs = new Float32Array(8);
                var material = plane.material;
                var tex = _this._renderableData._cacheTexture;
                if (material.diffuseTexture !== tex) {
                    material.diffuseTexture = tex;
                    tex.hasAlpha = true;
                }
                var nodeuv = _this._renderableData._cacheNodeUVs;
                for (var i = 0; i < 4; i++) {
                    vd.uvs[i * 2 + 0] = nodeuv[i].x;
                    vd.uvs[i * 2 + 1] = nodeuv[i].y;
                }
                vd.applyToMesh(plane);
            };
            this._notifDebugMode = false;
            this._mapCounter = 0;
            this._drawCallsOpaqueCounter = new BABYLON.PerfCounter();
            this._drawCallsAlphaTestCounter = new BABYLON.PerfCounter();
            this._drawCallsTransparentCounter = new BABYLON.PerfCounter();
            this._groupRenderCounter = new BABYLON.PerfCounter();
            this._updateTransparentDataCounter = new BABYLON.PerfCounter();
            this._cachedGroupRenderCounter = new BABYLON.PerfCounter();
            this._updateCachedStateCounter = new BABYLON.PerfCounter();
            this._updateLayoutCounter = new BABYLON.PerfCounter();
            this._updatePositioningCounter = new BABYLON.PerfCounter();
            this._updateLocalTransformCounter = new BABYLON.PerfCounter();
            this._updateGlobalTransformCounter = new BABYLON.PerfCounter();
            this._boundingInfoRecomputeCounter = new BABYLON.PerfCounter();
            this._uid = null;
            this._cachedCanvasGroup = null;
            this._profileInfoText = null;
            BABYLON.Prim2DBase._isCanvasInit = false;
            if (!settings) {
                settings = {};
            }
            if (this._cachingStrategy !== Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                this._background = new BABYLON.Rectangle2D({ parent: this, id: "###CANVAS BACKGROUND###", size: settings.size }); //TODO CHECK when size is null
                this._background.zOrder = 1.0;
                this._background.isPickable = false;
                this._background.origin = BABYLON.Vector2.Zero();
                this._background.levelVisible = false;
                if (settings.backgroundRoundRadius != null) {
                    this.backgroundRoundRadius = settings.backgroundRoundRadius;
                }
                if (settings.backgroundBorder != null) {
                    if (typeof (settings.backgroundBorder) === "string") {
                        this.backgroundBorder = Canvas2D.GetBrushFromString(settings.backgroundBorder);
                    }
                    else {
                        this.backgroundBorder = settings.backgroundBorder;
                    }
                }
                if (settings.backgroundBorderThickNess != null) {
                    this.backgroundBorderThickness = settings.backgroundBorderThickNess;
                }
                if (settings.backgroundFill != null) {
                    if (typeof (settings.backgroundFill) === "string") {
                        this.backgroundFill = Canvas2D.GetBrushFromString(settings.backgroundFill);
                    }
                    else {
                        this.backgroundFill = settings.backgroundFill;
                    }
                }
                // Put a handler to resize the background whenever the canvas is resizing
                this.propertyChanged.add(function (e, s) {
                    if (e.propertyName === "size") {
                        _this._background.size = _this.size;
                    }
                }, BABYLON.Group2D.sizeProperty.flagId);
                this._background._patchHierarchy(this);
            }
            var engine = scene.getEngine();
            this.__engineData = engine.getOrAddExternalDataWithFactory("__BJSCANVAS2D__", function (k) { return new Canvas2DEngineBoundData(); });
            this._primPointerInfo = new BABYLON.PrimitivePointerInfo();
            this._capturedPointers = new BABYLON.StringDictionary();
            this._pickStartingPosition = BABYLON.Vector2.Zero();
            this._hierarchyLevelMaxSiblingCount = 50;
            this._hierarchyDepth = 0;
            this._zOrder = 0;
            this._zMax = 1;
            this._scene = scene;
            this._engine = engine;
            this._renderingSize = new BABYLON.Size(0, 0);
            this._designSize = settings.designSize || null;
            this._designUseHorizAxis = settings.designUseHorizAxis === true;
            this._trackedGroups = new Array();
            this._maxAdaptiveWorldSpaceCanvasSize = null;
            this._groupCacheMaps = new BABYLON.StringDictionary();
            this._patchHierarchy(this);
            var enableInteraction = (settings.enableInteraction == null) ? true : settings.enableInteraction;
            this._fitRenderingDevice = !settings.size;
            if (!settings.size) {
                settings.size = new BABYLON.Size(engine.getRenderWidth(), engine.getRenderHeight());
            }
            // Register scene dispose to also dispose the canvas when it'll happens
            scene.onDisposeObservable.add(function (d, s) {
                _this.dispose();
            });
            if (this._isScreenSpace) {
                this._afterRenderObserver = this._scene.onAfterRenderObservable.add(function (d, s) {
                    _this._engine.clear(null, false, true, true);
                    _this._render();
                });
            }
            else {
                this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add(function (d, s) {
                    _this._render();
                });
            }
            this._supprtInstancedArray = this._engine.getCaps().instancedArrays !== null;
            //this._supprtInstancedArray = false; // TODO REMOVE!!!
            this._setupInteraction(enableInteraction);
            // Register this instance
            Canvas2D._INSTANCES.push(this);
        }
        Object.defineProperty(Canvas2D.prototype, "drawCallsOpaqueCounter", {
            get: function () {
                return this._drawCallsOpaqueCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "drawCallsAlphaTestCounter", {
            get: function () {
                return this._drawCallsAlphaTestCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "drawCallsTransparentCounter", {
            get: function () {
                return this._drawCallsTransparentCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "groupRenderCounter", {
            get: function () {
                return this._groupRenderCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateTransparentDataCounter", {
            get: function () {
                return this._updateTransparentDataCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "cachedGroupRenderCounter", {
            get: function () {
                return this._cachedGroupRenderCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateCachedStateCounter", {
            get: function () {
                return this._updateCachedStateCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateLayoutCounter", {
            get: function () {
                return this._updateLayoutCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updatePositioningCounter", {
            get: function () {
                return this._updatePositioningCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateLocalTransformCounter", {
            get: function () {
                return this._updateLocalTransformCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateGlobalTransformCounter", {
            get: function () {
                return this._updateGlobalTransformCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "boundingInfoRecomputeCounter", {
            get: function () {
                return this._boundingInfoRecomputeCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D, "instances", {
            get: function () {
                return Canvas2D._INSTANCES;
            },
            enumerable: true,
            configurable: true
        });
        Canvas2D.prototype._canvasPreInit = function (settings) {
            var cachingStrategy = (settings.cachingStrategy == null) ? Canvas2D.CACHESTRATEGY_DONTCACHE : settings.cachingStrategy;
            this._cachingStrategy = cachingStrategy;
            this._isScreenSpace = (settings.isScreenSpace == null) ? true : settings.isScreenSpace;
        };
        Canvas2D.prototype._setupInteraction = function (enable) {
            var _this = this;
            // No change detection
            if (enable === this._interactionEnabled) {
                return;
            }
            // Set the new state
            this._interactionEnabled = enable;
            // ScreenSpace mode
            if (this._isScreenSpace) {
                // Disable interaction
                if (!enable) {
                    if (this._scenePrePointerObserver) {
                        this.scene.onPrePointerObservable.remove(this._scenePrePointerObserver);
                        this._scenePrePointerObserver = null;
                    }
                    return;
                }
                // Enable Interaction
                // Register the observable
                this._scenePrePointerObserver = this.scene.onPrePointerObservable.add(function (e, s) {
                    if (_this.isVisible === false) {
                        return;
                    }
                    var hs = 1 / _this.engine.getHardwareScalingLevel();
                    var localPos = e.localPosition.multiplyByFloats(hs, hs);
                    _this._handlePointerEventForInteraction(e, localPos, s);
                });
            }
            else {
                var scene = this.scene;
                if (enable) {
                    scene.constantlyUpdateMeshUnderPointer = true;
                    this._scenePointerObserver = scene.onPointerObservable.add(function (e, s) {
                        if (_this.isVisible === false) {
                            return;
                        }
                        if (e.pickInfo.hit && e.pickInfo.pickedMesh === _this._worldSpaceNode && _this.worldSpaceToNodeLocal) {
                            var localPos = _this.worldSpaceToNodeLocal(e.pickInfo.pickedPoint);
                            _this._handlePointerEventForInteraction(e, localPos, s);
                        }
                    });
                }
                else {
                    if (this._scenePointerObserver) {
                        this.scene.onPointerObservable.remove(this._scenePointerObserver);
                        this._scenePointerObserver = null;
                    }
                }
            }
        };
        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        Canvas2D.prototype._setPointerCapture = function (pointerId, primitive) {
            if (this.isPointerCaptured(pointerId)) {
                return false;
            }
            // Try to capture the pointer on the HTML side
            try {
                this.engine.getRenderingCanvas().setPointerCapture(pointerId);
            }
            catch (e) {
            }
            this._primPointerInfo.updateRelatedTarget(primitive, BABYLON.Vector2.Zero());
            this._bubbleNotifyPrimPointerObserver(primitive, BABYLON.PrimitivePointerInfo.PointerGotCapture, null);
            this._capturedPointers.add(pointerId.toString(), primitive);
            return true;
        };
        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        Canvas2D.prototype._releasePointerCapture = function (pointerId, primitive) {
            if (this._capturedPointers.get(pointerId.toString()) !== primitive) {
                return false;
            }
            // Try to release the pointer on the HTML side
            try {
                this.engine.getRenderingCanvas().releasePointerCapture(pointerId);
            }
            catch (e) {
            }
            this._primPointerInfo.updateRelatedTarget(primitive, BABYLON.Vector2.Zero());
            this._bubbleNotifyPrimPointerObserver(primitive, BABYLON.PrimitivePointerInfo.PointerLostCapture, null);
            this._capturedPointers.remove(pointerId.toString());
            return true;
        };
        /**
         * Determine if the given pointer is captured or not
         * @param pointerId the Id of the pointer
         * @return true if it's captured, false otherwise
         */
        Canvas2D.prototype.isPointerCaptured = function (pointerId) {
            return this._capturedPointers.contains(pointerId.toString());
        };
        Canvas2D.prototype.getCapturedPrimitive = function (pointerId) {
            // Avoid unnecessary lookup
            if (this._capturedPointers.count === 0) {
                return null;
            }
            return this._capturedPointers.get(pointerId.toString());
        };
        Canvas2D.prototype._handlePointerEventForInteraction = function (eventData, localPosition, eventState) {
            // Dispose check
            if (this.isDisposed) {
                return;
            }
            // Update the this._primPointerInfo structure we'll send to observers using the PointerEvent data
            if (!this._updatePointerInfo(eventData, localPosition)) {
                return;
            }
            var capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);
            // Make sure the intersection list is up to date, we maintain this list either in response of a mouse event (here) or before rendering the canvas.
            // Why before rendering the canvas? because some primitives may move and get away/under the mouse cursor (which is not moving). So we need to update at both location in order to always have an accurate list, which is needed for the hover state change.
            this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, capturedPrim !== null, true);
            // Update the over status, same as above, it's could be done here or during rendering, but will be performed only once per render frame
            this._updateOverStatus(true);
            // Check if we have nothing to raise
            if (!this._actualOverPrimitive && !capturedPrim) {
                return;
            }
            // Update the relatedTarget info with the over primitive or the captured one (if any)
            var targetPrim = capturedPrim || this._actualOverPrimitive.prim;
            var targetPointerPos = capturedPrim ? this._primPointerInfo.canvasPointerPos.subtract(new BABYLON.Vector2(targetPrim.globalTransform.m[12], targetPrim.globalTransform.m[13])) : this._actualOverPrimitive.intersectionLocation;
            this._primPointerInfo.updateRelatedTarget(targetPrim, targetPointerPos);
            // Analyze the pointer event type and fire proper events on the primitive
            var skip = false;
            if (eventData.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerMouseWheel, eventData);
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerMove, eventData);
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerDown, eventData);
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerUp, eventData);
            }
            eventState.skipNextObservers = skip;
        };
        Canvas2D.prototype._updatePointerInfo = function (eventData, localPosition) {
            var s = this.scale;
            var pii = this._primPointerInfo;
            if (!pii.canvasPointerPos) {
                pii.canvasPointerPos = BABYLON.Vector2.Zero();
            }
            var camera = this._scene.cameraToUseForPointers || this._scene.activeCamera;
            if (!camera || !camera.viewport) {
                return false;
            }
            var engine = this._scene.getEngine();
            if (this._isScreenSpace) {
                var cameraViewport = camera.viewport;
                var viewport = cameraViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
                // Moving coordinates to local viewport world
                var x = localPosition.x - viewport.x;
                var y = localPosition.y - viewport.y;
                pii.canvasPointerPos.x = (x - this.actualPosition.x) / s;
                pii.canvasPointerPos.y = (engine.getRenderHeight() - y - this.actualPosition.y) / s;
            }
            else {
                pii.canvasPointerPos.x = localPosition.x / s;
                pii.canvasPointerPos.y = localPosition.y / s;
            }
            //console.log(`UpdatePointerInfo for ${this.id}, X:${pii.canvasPointerPos.x}, Y:${pii.canvasPointerPos.y}`);
            pii.mouseWheelDelta = 0;
            if (eventData.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
                var event = eventData.event;
                if (event.wheelDelta) {
                    pii.mouseWheelDelta = event.wheelDelta / (BABYLON.PrimitivePointerInfo.MouseWheelPrecision * 40);
                }
                else if (event.detail) {
                    pii.mouseWheelDelta = -event.detail / BABYLON.PrimitivePointerInfo.MouseWheelPrecision;
                }
            }
            else {
                var pe = eventData.event;
                pii.ctrlKey = pe.ctrlKey;
                pii.altKey = pe.altKey;
                pii.shiftKey = pe.shiftKey;
                pii.metaKey = pe.metaKey;
                pii.button = pe.button;
                pii.buttons = pe.buttons;
                pii.pointerId = pe.pointerId;
                pii.width = pe.width;
                pii.height = pe.height;
                pii.presssure = pe.pressure;
                pii.tilt.x = pe.tiltX;
                pii.tilt.y = pe.tiltY;
                pii.isCaptured = this.getCapturedPrimitive(pe.pointerId) !== null;
            }
            return true;
        };
        Canvas2D.prototype._updateIntersectionList = function (mouseLocalPos, isCapture, force) {
            if (!force && (this.scene.getRenderId() === this._intersectionRenderId)) {
                return;
            }
            // A little safe guard, it might happens than the event is triggered before the first render and nothing is computed, this simple check will make sure everything will be fine
            if (!this._globalTransform) {
                this.updateCachedStates(true);
            }
            var ii = Canvas2D._interInfo;
            ii.pickPosition.x = mouseLocalPos.x;
            ii.pickPosition.y = mouseLocalPos.y;
            ii.findFirstOnly = false;
            // Fast rejection: test if the mouse pointer is outside the canvas's bounding Info
            if (!isCapture && !this.levelBoundingInfo.doesIntersect(ii.pickPosition)) {
                // Reset intersection info as we don't hit anything
                ii.intersectedPrimitives = new Array();
                ii.topMostIntersectedPrimitive = null;
            }
            else {
                // The pointer is inside the Canvas, do an intersection test
                this.intersect(ii);
            }
            {
                // Update prev/actual intersection info, fire "overPrim" property change if needed
                this._previousIntersectionList = this._actualIntersectionList;
                this._actualIntersectionList = ii.intersectedPrimitives;
                this._previousOverPrimitive = this._actualOverPrimitive;
                this._actualOverPrimitive = ii.topMostIntersectedPrimitive;
                var prev = (this._previousOverPrimitive != null) ? this._previousOverPrimitive.prim : null;
                var actual = (this._actualOverPrimitive != null) ? this._actualOverPrimitive.prim : null;
                if (prev !== actual) {
                    this.onPropertyChanged("overPrim", this._previousOverPrimitive ? this._previousOverPrimitive.prim : null, this._actualOverPrimitive ? this._actualOverPrimitive.prim : null);
                }
            }
            this._intersectionRenderId = this.scene.getRenderId();
        };
        // Based on the previousIntersectionList and the actualInstersectionList we can determined which primitives are being hover state or loosing it
        Canvas2D.prototype._updateOverStatus = function (force) {
            if ((!force && (this.scene.getRenderId() === this._hoverStatusRenderId)) || !this._previousIntersectionList || !this._actualIntersectionList) {
                return;
            }
            // Detect a change of over
            var prevPrim = this._previousOverPrimitive ? this._previousOverPrimitive.prim : null;
            var actualPrim = this._actualOverPrimitive ? this._actualOverPrimitive.prim : null;
            if (prevPrim !== actualPrim) {
                // Detect if the current pointer is captured, only fire event if they belong to the capture primitive
                var capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);
                // Notify the previous "over" prim that the pointer is no longer over it
                if ((capturedPrim && capturedPrim === prevPrim) || (!capturedPrim && prevPrim)) {
                    this._primPointerInfo.updateRelatedTarget(prevPrim, this._previousOverPrimitive.intersectionLocation);
                    this._bubbleNotifyPrimPointerObserver(prevPrim, BABYLON.PrimitivePointerInfo.PointerOut, null);
                }
                // Notify the new "over" prim that the pointer is over it
                if ((capturedPrim && capturedPrim === actualPrim) || (!capturedPrim && actualPrim)) {
                    this._primPointerInfo.updateRelatedTarget(actualPrim, this._actualOverPrimitive.intersectionLocation);
                    this._bubbleNotifyPrimPointerObserver(actualPrim, BABYLON.PrimitivePointerInfo.PointerOver, null);
                }
            }
            this._hoverStatusRenderId = this.scene.getRenderId();
        };
        Canvas2D.prototype._updatePrimPointerPos = function (prim) {
            if (this._primPointerInfo.isCaptured) {
                this._primPointerInfo.primitivePointerPos = this._primPointerInfo.relatedTargetPointerPos;
            }
            else {
                for (var _i = 0, _a = this._actualIntersectionList; _i < _a.length; _i++) {
                    var pii = _a[_i];
                    if (pii.prim === prim) {
                        this._primPointerInfo.primitivePointerPos = pii.intersectionLocation;
                        return;
                    }
                }
            }
        };
        Canvas2D.prototype._debugExecObserver = function (prim, mask) {
            if (!this._notifDebugMode) {
                return;
            }
            var debug = "";
            for (var i = 0; i < prim.hierarchyDepth; i++) {
                debug += "  ";
            }
            var pii = this._primPointerInfo;
            debug += "[RID:" + this.scene.getRenderId() + "] [" + prim.hierarchyDepth + "] event:" + BABYLON.PrimitivePointerInfo.getEventTypeName(mask) + ", id: " + prim.id + " (" + BABYLON.Tools.getClassName(prim) + "), primPos: " + pii.primitivePointerPos.toString() + ", canvasPos: " + pii.canvasPointerPos.toString();
            console.log(debug);
        };
        Canvas2D.prototype._bubbleNotifyPrimPointerObserver = function (prim, mask, eventData) {
            var ppi = this._primPointerInfo;
            var event = eventData ? eventData.event : null;
            // In case of PointerOver/Out we will first notify the parent with PointerEnter/Leave
            if ((mask & (BABYLON.PrimitivePointerInfo.PointerOver | BABYLON.PrimitivePointerInfo.PointerOut)) !== 0) {
                this._notifParents(prim, mask);
            }
            var bubbleCancelled = false;
            var cur = prim;
            while (cur) {
                // Only trigger the observers if the primitive is intersected (except for out)
                if (!bubbleCancelled) {
                    this._updatePrimPointerPos(cur);
                    // Exec the observers
                    this._debugExecObserver(cur, mask);
                    if (!cur._pointerEventObservable.notifyObservers(ppi, mask) && eventData instanceof BABYLON.PointerInfoPre) {
                        eventData.skipOnPointerObservable = true;
                        return false;
                    }
                    this._triggerActionManager(cur, ppi, mask, event);
                    // Bubble canceled? If we're not executing PointerOver or PointerOut, quit immediately
                    // If it's PointerOver/Out we have to trigger PointerEnter/Leave no matter what
                    if (ppi.cancelBubble) {
                        if ((mask & (BABYLON.PrimitivePointerInfo.PointerOver | BABYLON.PrimitivePointerInfo.PointerOut)) === 0) {
                            return false;
                        }
                        // We're dealing with PointerOver/Out, let's keep looping to fire PointerEnter/Leave, but not Over/Out anymore
                        bubbleCancelled = true;
                    }
                }
                // If bubble is cancel we didn't update the Primitive Pointer Pos yet, let's do it
                if (bubbleCancelled) {
                    this._updatePrimPointerPos(cur);
                }
                // NOTE TO MYSELF, this is commented right now because it doesn't seemed needed but I can't figure out why I put this code in the first place
                //// Trigger a PointerEnter corresponding to the PointerOver
                //if (mask === PrimitivePointerInfo.PointerOver) {
                //    this._debugExecObserver(cur, PrimitivePointerInfo.PointerEnter);
                //    cur._pointerEventObservable.notifyObservers(ppi, PrimitivePointerInfo.PointerEnter);
                //}
                //// Trigger a PointerLeave corresponding to the PointerOut
                //else if (mask === PrimitivePointerInfo.PointerOut) {
                //    this._debugExecObserver(cur, PrimitivePointerInfo.PointerLeave);
                //    cur._pointerEventObservable.notifyObservers(ppi, PrimitivePointerInfo.PointerLeave);
                //}
                // Loop to the parent
                cur = cur.parent;
            }
            return true;
        };
        Canvas2D.prototype._triggerActionManager = function (prim, ppi, mask, eventData) {
            var _this = this;
            // A little safe guard, it might happens than the event is triggered before the first render and nothing is computed, this simple check will make sure everything will be fine
            if (!this._globalTransform) {
                this.updateCachedStates(true);
            }
            // Process Trigger related to PointerDown
            if ((mask & BABYLON.PrimitivePointerInfo.PointerDown) !== 0) {
                // On pointer down, record the current position and time to be able to trick PickTrigger and LongPressTrigger
                this._pickStartingPosition = ppi.primitivePointerPos.clone();
                this._pickStartingTime = new Date().getTime();
                this._pickedDownPrim = null;
                if (prim.actionManager) {
                    this._pickedDownPrim = prim;
                    if (prim.actionManager.hasPickTriggers) {
                        var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                        switch (eventData.button) {
                            case 0:
                                prim.actionManager.processTrigger(BABYLON.ActionManager.OnLeftPickTrigger, actionEvent);
                                break;
                            case 1:
                                prim.actionManager.processTrigger(BABYLON.ActionManager.OnCenterPickTrigger, actionEvent);
                                break;
                            case 2:
                                prim.actionManager.processTrigger(BABYLON.ActionManager.OnRightPickTrigger, actionEvent);
                                break;
                        }
                        prim.actionManager.processTrigger(BABYLON.ActionManager.OnPickDownTrigger, actionEvent);
                    }
                    if (prim.actionManager.hasSpecificTrigger(BABYLON.ActionManager.OnLongPressTrigger)) {
                        window.setTimeout(function () {
                            var ppi = _this._primPointerInfo;
                            var capturedPrim = _this.getCapturedPrimitive(ppi.pointerId);
                            _this._updateIntersectionList(ppi.canvasPointerPos, capturedPrim !== null, true);
                            _this._updateOverStatus(false);
                            var ii = new BABYLON.IntersectInfo2D();
                            ii.pickPosition = ppi.canvasPointerPos.clone();
                            ii.findFirstOnly = false;
                            _this.intersect(ii);
                            if (ii.isPrimIntersected(prim) !== null) {
                                if (prim.actionManager) {
                                    if (_this._pickStartingTime !== 0 && ((new Date().getTime() - _this._pickStartingTime) > BABYLON.ActionManager.LongPressDelay) && (Math.abs(_this._pickStartingPosition.x - ii.pickPosition.x) < BABYLON.ActionManager.DragMovementThreshold && Math.abs(_this._pickStartingPosition.y - ii.pickPosition.y) < BABYLON.ActionManager.DragMovementThreshold)) {
                                        _this._pickStartingTime = 0;
                                        prim.actionManager.processTrigger(BABYLON.ActionManager.OnLongPressTrigger, BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData));
                                    }
                                }
                            }
                        }, BABYLON.ActionManager.LongPressDelay);
                    }
                }
            }
            else if ((mask & BABYLON.PrimitivePointerInfo.PointerUp) !== 0) {
                this._pickStartingTime = 0;
                var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                if (prim.actionManager) {
                    // OnPickUpTrigger
                    prim.actionManager.processTrigger(BABYLON.ActionManager.OnPickUpTrigger, actionEvent);
                    // OnPickTrigger
                    if (Math.abs(this._pickStartingPosition.x - ppi.canvasPointerPos.x) < BABYLON.ActionManager.DragMovementThreshold && Math.abs(this._pickStartingPosition.y - ppi.canvasPointerPos.y) < BABYLON.ActionManager.DragMovementThreshold) {
                        prim.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger, actionEvent);
                    }
                }
                // OnPickOutTrigger
                if (this._pickedDownPrim && this._pickedDownPrim.actionManager && (this._pickedDownPrim !== prim)) {
                    this._pickedDownPrim.actionManager.processTrigger(BABYLON.ActionManager.OnPickOutTrigger, actionEvent);
                }
            }
            else if ((mask & BABYLON.PrimitivePointerInfo.PointerOver) !== 0) {
                if (prim.actionManager) {
                    var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                    prim.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOverTrigger, actionEvent);
                }
            }
            else if ((mask & BABYLON.PrimitivePointerInfo.PointerOut) !== 0) {
                if (prim.actionManager) {
                    var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                    prim.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOutTrigger, actionEvent);
                }
            }
        };
        Canvas2D.prototype._notifParents = function (prim, mask) {
            var pii = this._primPointerInfo;
            var curPrim = this;
            while (curPrim) {
                this._updatePrimPointerPos(curPrim);
                // Fire the proper notification
                if (mask === BABYLON.PrimitivePointerInfo.PointerOver) {
                    this._debugExecObserver(curPrim, BABYLON.PrimitivePointerInfo.PointerEnter);
                    curPrim._pointerEventObservable.notifyObservers(pii, BABYLON.PrimitivePointerInfo.PointerEnter);
                }
                else if (mask === BABYLON.PrimitivePointerInfo.PointerOut) {
                    this._debugExecObserver(curPrim, BABYLON.PrimitivePointerInfo.PointerLeave);
                    curPrim._pointerEventObservable.notifyObservers(pii, BABYLON.PrimitivePointerInfo.PointerLeave);
                }
                curPrim = curPrim.parent;
            }
        };
        /**
         * Don't forget to call the dispose method when you're done with the Canvas instance.
         * But don't worry, if you dispose its scene, the canvas will be automatically disposed too.
         */
        Canvas2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._profilingCanvas) {
                this._profilingCanvas.dispose();
                this._profilingCanvas = null;
            }
            if (this.interactionEnabled) {
                this._setupInteraction(false);
            }
            if (this._beforeRenderObserver) {
                this._scene.onBeforeRenderObservable.remove(this._beforeRenderObserver);
                this._beforeRenderObserver = null;
            }
            if (this._afterRenderObserver) {
                this._scene.onAfterRenderObservable.remove(this._afterRenderObserver);
                this._afterRenderObserver = null;
            }
            if (this._groupCacheMaps) {
                this._groupCacheMaps.forEach(function (k, m) { return m.forEach(function (e) { return e.dispose(); }); });
                this._groupCacheMaps = null;
            }
            // Unregister this instance
            var index = Canvas2D._INSTANCES.indexOf(this);
            if (index > -1) {
                Canvas2D._INSTANCES.splice(index, 1);
            }
        };
        Object.defineProperty(Canvas2D.prototype, "scene", {
            /**
             * Accessor to the Scene that owns the Canvas
             * @returns The instance of the Scene object
             */
            get: function () {
                return this._scene;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "engine", {
            /**
             * Accessor to the Engine that drives the Scene used by this Canvas
             * @returns The instance of the Engine object
             */
            get: function () {
                return this._engine;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "uid", {
            /**
             * return a unique identifier for the Canvas2D
             */
            get: function () {
                if (!this._uid) {
                    this._uid = BABYLON.Tools.RandomId();
                }
                return this._uid;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "renderObservable", {
            /**
             * And observable called during the Canvas rendering process.
             * This observable is called twice per render, each time with a different mask:
             *  - 1: before render is executed
             *  - 2: after render is executed
             */
            get: function () {
                if (!this._renderObservable) {
                    this._renderObservable = new BABYLON.Observable();
                }
                return this._renderObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "cachingStrategy", {
            /**
             * Accessor of the Caching Strategy used by this Canvas.
             * See Canvas2D.CACHESTRATEGY_xxxx static members for more information
             * @returns the value corresponding to the used strategy.
             */
            get: function () {
                return this._cachingStrategy;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "isScreenSpace", {
            /**
             * Return true if the Canvas is a Screen Space one, false if it's a World Space one.
             * @returns {}
             */
            get: function () {
                return this._isScreenSpace;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "worldSpaceCanvasNode", {
            /**
             * Only valid for World Space Canvas, returns the scene node that displays the canvas
             */
            get: function () {
                return this._worldSpaceNode;
            },
            set: function (val) {
                this._worldSpaceNode = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "supportInstancedArray", {
            /**
             * Check if the WebGL Instanced Array extension is supported or not
             */
            get: function () {
                return this._supprtInstancedArray;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundFill", {
            /**
             * Property that defines the fill object used to draw the background of the Canvas.
             * Note that Canvas with a Caching Strategy of
             * @returns If the background is not set, null will be returned, otherwise a valid fill object is returned.
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.fill;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.fill) {
                    return;
                }
                this._background.fill = value;
                this._background.levelVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundBorder", {
            /**
             * Property that defines the border object used to draw the background of the Canvas.
             * @returns If the background is not set, null will be returned, otherwise a valid border object is returned.
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.border;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.border) {
                    return;
                }
                this._background.border = value;
                this._background.levelVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundBorderThickness", {
            /**
             * Property that defines the thickness of the border object used to draw the background of the Canvas.
             * @returns If the background is not set, null will be returned, otherwise a valid number matching the thickness is returned.
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.borderThickness;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.borderThickness) {
                    return;
                }
                this._background.borderThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundRoundRadius", {
            /**
             * You can set the roundRadius of the background
             * @returns The current roundRadius
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.roundRadius;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.roundRadius) {
                    return;
                }
                this._background.roundRadius = value;
                this._background.levelVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "interactionEnabled", {
            /**
             * Enable/Disable interaction for this Canvas
             * When enabled the Prim2DBase.pointerEventObservable property will notified when appropriate events occur
             */
            get: function () {
                return this._interactionEnabled;
            },
            set: function (enable) {
                this._setupInteraction(enable);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "designSize", {
            get: function () {
                return this._designSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "designSizeUseHorizAxis", {
            get: function () {
                return this._designUseHorizAxis;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "overPrim", {
            /**
             * Return
             */
            get: function () {
                return this._actualOverPrimitive ? this._actualOverPrimitive.prim : null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "_engineData", {
            /**
             * Access the babylon.js' engine bound data, do not invoke this method, it's for internal purpose only
             * @returns {}
             */
            get: function () {
                return this.__engineData;
            },
            enumerable: true,
            configurable: true
        });
        Canvas2D.prototype.createCanvasProfileInfoCanvas = function () {
            if (this._profilingCanvas) {
                return this._profilingCanvas;
            }
            var canvas = new ScreenSpaceCanvas2D(this.scene, {
                id: "ProfileInfoCanvas", cachingStrategy: Canvas2D.CACHESTRATEGY_DONTCACHE, children: [
                    new BABYLON.Rectangle2D({
                        id: "ProfileBorder", border: "#FFFFFFFF", borderThickness: 2, roundRadius: 5, fill: "#C04040C0", marginAlignment: "h: left, v: top", margin: "10", padding: "10", children: [
                            new BABYLON.Text2D("Stats", { id: "ProfileInfoText", marginAlignment: "h: left, v: top", fontName: "10pt Lucida Console" })
                        ]
                    })
                ]
            });
            this._profileInfoText = canvas.findById("ProfileInfoText");
            this._profilingCanvas = canvas;
            return canvas;
        };
        Canvas2D.prototype.checkBackgroundAvailability = function () {
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                throw Error("Can't use Canvas Background with the caching strategy TOPLEVELGROUPS");
            }
        };
        Canvas2D.prototype._initPerfMetrics = function () {
            this._drawCallsOpaqueCounter.fetchNewFrame();
            this._drawCallsAlphaTestCounter.fetchNewFrame();
            this._drawCallsTransparentCounter.fetchNewFrame();
            this._groupRenderCounter.fetchNewFrame();
            this._updateTransparentDataCounter.fetchNewFrame();
            this._cachedGroupRenderCounter.fetchNewFrame();
            this._updateCachedStateCounter.fetchNewFrame();
            this._updateLayoutCounter.fetchNewFrame();
            this._updatePositioningCounter.fetchNewFrame();
            this._updateLocalTransformCounter.fetchNewFrame();
            this._updateGlobalTransformCounter.fetchNewFrame();
            this._boundingInfoRecomputeCounter.fetchNewFrame();
        };
        Canvas2D.prototype._fetchPerfMetrics = function () {
            this._drawCallsOpaqueCounter.addCount(0, true);
            this._drawCallsAlphaTestCounter.addCount(0, true);
            this._drawCallsTransparentCounter.addCount(0, true);
            this._groupRenderCounter.addCount(0, true);
            this._updateTransparentDataCounter.addCount(0, true);
            this._cachedGroupRenderCounter.addCount(0, true);
            this._updateCachedStateCounter.addCount(0, true);
            this._updateLayoutCounter.addCount(0, true);
            this._updatePositioningCounter.addCount(0, true);
            this._updateLocalTransformCounter.addCount(0, true);
            this._updateGlobalTransformCounter.addCount(0, true);
            this._boundingInfoRecomputeCounter.addCount(0, true);
        };
        Canvas2D.prototype._updateProfileCanvas = function () {
            if (this._profileInfoText == null) {
                return;
            }
            var format = function (v) { return (Math.round(v * 100) / 100).toString(); };
            var p = "Draw Calls:\n" +
                (" - Opaque:      " + format(this.drawCallsOpaqueCounter.current) + ", (avg:" + format(this.drawCallsOpaqueCounter.lastSecAverage) + ", t:" + format(this.drawCallsOpaqueCounter.total) + ")\n") +
                (" - AlphaTest:   " + format(this.drawCallsAlphaTestCounter.current) + ", (avg:" + format(this.drawCallsAlphaTestCounter.lastSecAverage) + ", t:" + format(this.drawCallsAlphaTestCounter.total) + ")\n") +
                (" - Transparent: " + format(this.drawCallsTransparentCounter.current) + ", (avg:" + format(this.drawCallsTransparentCounter.lastSecAverage) + ", t:" + format(this.drawCallsTransparentCounter.total) + ")\n") +
                ("Group Render: " + this.groupRenderCounter.current + ", (avg:" + format(this.groupRenderCounter.lastSecAverage) + ", t:" + format(this.groupRenderCounter.total) + ")\n") +
                ("Update Transparent Data: " + this.updateTransparentDataCounter.current + ", (avg:" + format(this.updateTransparentDataCounter.lastSecAverage) + ", t:" + format(this.updateTransparentDataCounter.total) + ")\n") +
                ("Cached Group Render: " + this.cachedGroupRenderCounter.current + ", (avg:" + format(this.cachedGroupRenderCounter.lastSecAverage) + ", t:" + format(this.cachedGroupRenderCounter.total) + ")\n") +
                ("Update Cached States: " + this.updateCachedStateCounter.current + ", (avg:" + format(this.updateCachedStateCounter.lastSecAverage) + ", t:" + format(this.updateCachedStateCounter.total) + ")\n") +
                (" - Update Layout: " + this.updateLayoutCounter.current + ", (avg:" + format(this.updateLayoutCounter.lastSecAverage) + ", t:" + format(this.updateLayoutCounter.total) + ")\n") +
                (" - Update Positioning: " + this.updatePositioningCounter.current + ", (avg:" + format(this.updatePositioningCounter.lastSecAverage) + ", t:" + format(this.updatePositioningCounter.total) + ")\n") +
                (" - Update Local  Trans: " + this.updateLocalTransformCounter.current + ", (avg:" + format(this.updateLocalTransformCounter.lastSecAverage) + ", t:" + format(this.updateLocalTransformCounter.total) + ")\n") +
                (" - Update Global Trans: " + this.updateGlobalTransformCounter.current + ", (avg:" + format(this.updateGlobalTransformCounter.lastSecAverage) + ", t:" + format(this.updateGlobalTransformCounter.total) + ")\n") +
                (" - BoundingInfo Recompute: " + this.boundingInfoRecomputeCounter.current + ", (avg:" + format(this.boundingInfoRecomputeCounter.lastSecAverage) + ", t:" + format(this.boundingInfoRecomputeCounter.total) + ")\n");
            this._profileInfoText.text = p;
        };
        Canvas2D.prototype._addDrawCallCount = function (count, renderMode) {
            switch (renderMode) {
                case BABYLON.Render2DContext.RenderModeOpaque:
                    this._drawCallsOpaqueCounter.addCount(count, false);
                    return;
                case BABYLON.Render2DContext.RenderModeAlphaTest:
                    this._drawCallsAlphaTestCounter.addCount(count, false);
                    return;
                case BABYLON.Render2DContext.RenderModeTransparent:
                    this._drawCallsTransparentCounter.addCount(count, false);
                    return;
            }
        };
        Canvas2D.prototype._addGroupRenderCount = function (count) {
            this._groupRenderCounter.addCount(count, false);
        };
        Canvas2D.prototype._addUpdateTransparentDataCount = function (count) {
            this._updateTransparentDataCounter.addCount(count, false);
        };
        Canvas2D.prototype.addCachedGroupRenderCounter = function (count) {
            this._cachedGroupRenderCounter.addCount(count, false);
        };
        Canvas2D.prototype.addUpdateCachedStateCounter = function (count) {
            this._updateCachedStateCounter.addCount(count, false);
        };
        Canvas2D.prototype.addUpdateLayoutCounter = function (count) {
            this._updateLayoutCounter.addCount(count, false);
        };
        Canvas2D.prototype.addUpdatePositioningCounter = function (count) {
            this._updatePositioningCounter.addCount(count, false);
        };
        Canvas2D.prototype.addupdateLocalTransformCounter = function (count) {
            this._updateLocalTransformCounter.addCount(count, false);
        };
        Canvas2D.prototype.addUpdateGlobalTransformCounter = function (count) {
            this._updateGlobalTransformCounter.addCount(count, false);
        };
        Canvas2D.prototype._updateTrackedNodes = function () {
            var cam = this.scene.cameraToUseForPointers || this.scene.activeCamera;
            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), Canvas2D._m);
            var rh = this.engine.getRenderHeight();
            var v = cam.viewport.toGlobal(this.engine.getRenderWidth(), rh);
            for (var _i = 0, _a = this._trackedGroups; _i < _a.length; _i++) {
                var group = _a[_i];
                if (group.isDisposed || !group.isVisible) {
                    continue;
                }
                var node = group.trackedNode;
                var worldMtx = node.getWorldMatrix();
                var proj = BABYLON.Vector3.Project(Canvas2D._v, worldMtx, Canvas2D._m, v);
                var s = this.scale;
                group.x = Math.round(proj.x / s);
                group.y = Math.round((rh - proj.y) / s);
            }
        };
        /**
         * Call this method change you want to have layout related data computed and up to date (layout area, primitive area, local/global transformation matrices)
         */
        Canvas2D.prototype.updateCanvasLayout = function (forceRecompute) {
            this._updateCanvasState(forceRecompute);
        };
        Canvas2D.prototype._updateAdaptiveSizeWorldCanvas = function () {
            if (this._globalTransformStep < 2) {
                return;
            }
            var n = this.worldSpaceCanvasNode;
            var bi = n.getBoundingInfo().boundingBox;
            var v = bi.vectorsWorld;
            var cam = this.scene.cameraToUseForPointers || this.scene.activeCamera;
            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), Canvas2D._m);
            var vp = cam.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight());
            var projPoints = new Array(4);
            for (var i = 0; i < 4; i++) {
                projPoints[i] = BABYLON.Vector3.Project(v[i], Canvas2D._mI, Canvas2D._m, vp);
            }
            var left = projPoints[3].subtract(projPoints[0]).length();
            var top = projPoints[3].subtract(projPoints[1]).length();
            var right = projPoints[1].subtract(projPoints[2]).length();
            var bottom = projPoints[2].subtract(projPoints[0]).length();
            var w = Math.round(Math.max(top, bottom));
            var h = Math.round(Math.max(right, left));
            var isW = w > h;
            // Basically if it's under 256 we use 256, otherwise we take the biggest power of 2
            var edge = Math.max(w, h);
            if (edge < 256) {
                edge = 256;
            }
            else {
                edge = Math.pow(2, Math.ceil(Math.log(edge) / Math.log(2)));
            }
            // Clip values if needed
            edge = Math.min(edge, this._maxAdaptiveWorldSpaceCanvasSize);
            var newScale = edge / ((isW) ? this.size.width : this.size.height);
            if (newScale !== this.scale) {
                var scale = newScale;
                //                console.log(`New adaptive scale for Canvas ${this.id}, w: ${w}, h: ${h}, scale: ${scale}, edge: ${edge}, isW: ${isW}`);
                this._setRenderingScale(scale);
            }
        };
        Canvas2D.prototype._updateCanvasState = function (forceRecompute) {
            // Check if the update has already been made for this render Frame
            if (!forceRecompute && this.scene.getRenderId() === this._updateRenderId) {
                return;
            }
            // Detect a change of rendering size
            var renderingSizeChanged = false;
            var newWidth = this.engine.getRenderWidth();
            if (newWidth !== this._renderingSize.width) {
                renderingSizeChanged = true;
            }
            this._renderingSize.width = newWidth;
            var newHeight = this.engine.getRenderHeight();
            if (newHeight !== this._renderingSize.height) {
                renderingSizeChanged = true;
            }
            this._renderingSize.height = newHeight;
            // If the canvas fit the rendering size and it changed, update
            if (renderingSizeChanged && this._fitRenderingDevice) {
                this._actualSize = this._renderingSize.clone();
                this._size = this._renderingSize.clone();
                if (this._background) {
                    this._background.size = this.size;
                }
                // Dirty the Layout at the Canvas level to recompute as the size changed
                this._setLayoutDirty();
            }
            // If there's a design size, update the scale according to the renderingSize
            if (this._designSize) {
                var scale = void 0;
                if (this._designUseHorizAxis) {
                    scale = this._renderingSize.width / this._designSize.width;
                }
                else {
                    scale = this._renderingSize.height / this._designSize.height;
                }
                this.size = this._designSize.clone();
                this.actualSize = this._designSize.clone();
                this.scale = scale;
            }
            var context = new BABYLON.PrepareRender2DContext();
            ++this._globalTransformProcessStep;
            this.updateCachedStates(false);
            this._prepareGroupRender(context);
            this._updateRenderId = this.scene.getRenderId();
        };
        /**
         * Method that renders the Canvas, you should not invoke
         */
        Canvas2D.prototype._render = function () {
            this._initPerfMetrics();
            if (this._renderObservable && this._renderObservable.hasObservers()) {
                this._renderObservable.notifyObservers(this, Canvas2D.RENDEROBSERVABLE_PRE);
            }
            this._updateCanvasState(false);
            this._updateTrackedNodes();
            // Nothing to do is the Canvas is not visible
            if (this.isVisible === false) {
                return;
            }
            if (!this._isScreenSpace) {
                this._updateAdaptiveSizeWorldCanvas();
            }
            this._updateCanvasState(false);
            if (this._primPointerInfo.canvasPointerPos) {
                this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, false, false);
                this._updateOverStatus(false);
            }
            this.engine.setState(false);
            this._groupRender();
            if (!this._isScreenSpace) {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagWorldCacheChanged)) {
                    this.worldSpaceCacheChanged();
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagWorldCacheChanged);
                }
            }
            // If the canvas is cached at canvas level, we must manually render the sprite that will display its content
            if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS && this._cachedCanvasGroup) {
                this._cachedCanvasGroup._renderCachedCanvas();
            }
            this._fetchPerfMetrics();
            this._updateProfileCanvas();
            if (this._renderObservable && this._renderObservable.hasObservers()) {
                this._renderObservable.notifyObservers(this, Canvas2D.RENDEROBSERVABLE_POST);
            }
        };
        /**
         * Internal method that allocate a cache for the given group.
         * Caching is made using a collection of MapTexture where many groups have their bitmap cache stored inside.
         * @param group The group to allocate the cache of.
         * @return custom type with the PackedRect instance giving information about the cache location into the texture and also the MapTexture instance that stores the cache.
         */
        Canvas2D.prototype._allocateGroupCache = function (group, parent, minSize, useMipMap, anisotropicLevel) {
            if (useMipMap === void 0) { useMipMap = false; }
            if (anisotropicLevel === void 0) { anisotropicLevel = 1; }
            var key = (useMipMap ? "MipMap" : "NoMipMap") + "_" + anisotropicLevel;
            var rd = group._renderableData;
            var noResizeScale = rd._noResizeOnScale;
            var isCanvas = parent == null;
            var scale;
            if (noResizeScale) {
                scale = isCanvas ? Canvas2D._unS : group.parent.actualScale;
            }
            else {
                scale = group.actualScale;
            }
            // Determine size
            var size = group.actualSize;
            size = new BABYLON.Size(Math.ceil(size.width * scale.x), Math.ceil(size.height * scale.y));
            if (minSize) {
                size.width = Math.max(minSize.width, size.width);
                size.height = Math.max(minSize.height, size.height);
            }
            var mapArray = this._groupCacheMaps.getOrAddWithFactory(key, function () { return new Array(); });
            // Try to find a spot in one of the cached texture
            var res = null;
            var map;
            for (var _i = 0, mapArray_1 = mapArray; _i < mapArray_1.length; _i++) {
                var _map = mapArray_1[_i];
                map = _map;
                var node = map.allocateRect(size);
                if (node) {
                    res = { node: node, texture: map };
                    break;
                }
            }
            // Couldn't find a map that could fit the rect, create a new map for it
            if (!res) {
                var mapSize = new BABYLON.Size(Canvas2D._groupTextureCacheSize, Canvas2D._groupTextureCacheSize);
                // Check if the predefined size would fit, other create a custom size using the nearest bigger power of 2
                if (size.width > mapSize.width || size.height > mapSize.height) {
                    mapSize.width = Math.pow(2, Math.ceil(Math.log(size.width) / Math.log(2)));
                    mapSize.height = Math.pow(2, Math.ceil(Math.log(size.height) / Math.log(2)));
                }
                var id = "groupsMapChache" + this._mapCounter++ + "forCanvas" + this.id;
                map = new BABYLON.MapTexture(id, this._scene, mapSize, useMipMap ? BABYLON.Texture.TRILINEAR_SAMPLINGMODE : BABYLON.Texture.BILINEAR_SAMPLINGMODE, useMipMap);
                map.hasAlpha = true;
                map.anisotropicFilteringLevel = 4;
                mapArray.splice(0, 0, map);
                var node = map.allocateRect(size);
                res = { node: node, texture: map };
            }
            // Check if we have to create a Sprite that will display the content of the Canvas which is cached.
            // Don't do it in case of the group being a worldspace canvas (because its texture is bound to a WorldSpaceCanvas node)
            if (group !== this || this._isScreenSpace) {
                var node = res.node;
                // Special case if the canvas is entirely cached: create a group that will have a single sprite it will be rendered specifically at the very end of the rendering process
                var sprite = void 0;
                if (this._cachingStrategy === Canvas2D.CACHESTRATEGY_CANVAS) {
                    this._cachedCanvasGroup = BABYLON.Group2D._createCachedCanvasGroup(this);
                    sprite = new BABYLON.Sprite2D(map, { parent: this._cachedCanvasGroup, id: "__cachedCanvasSprite__", spriteSize: node.contentSize, spriteLocation: node.pos });
                    sprite.zOrder = 1;
                    sprite.origin = BABYLON.Vector2.Zero();
                }
                else {
                    sprite = new BABYLON.Sprite2D(map, { parent: parent, id: "__cachedSpriteOfGroup__" + group.id, x: group.actualPosition.x, y: group.actualPosition.y, spriteSize: node.contentSize, spriteLocation: node.pos, dontInheritParentScale: true });
                    sprite.origin = group.origin.clone();
                    sprite.addExternalData("__cachedGroup__", group);
                    sprite.pointerEventObservable.add(function (e, s) {
                        if (group.pointerEventObservable !== null) {
                            group.pointerEventObservable.notifyObservers(e, s.mask);
                        }
                    });
                    res.sprite = sprite;
                }
                if (sprite && noResizeScale) {
                    var relScale = isCanvas ? group.actualScale : group.actualScale.divide(group.parent.actualScale);
                    sprite.scaleX = relScale.x;
                    sprite.scaleY = relScale.y;
                }
            }
            return res;
        };
        /**
         * Internal method used to register a Scene Node to track position for the given group
         * Do not invoke this method, for internal purpose only.
         * @param group the group to track its associated Scene Node
         */
        Canvas2D.prototype._registerTrackedNode = function (group) {
            if (group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }
            this._trackedGroups.push(group);
            group._setFlags(BABYLON.SmartPropertyPrim.flagTrackedGroup);
        };
        /**
         * Internal method used to unregister a tracked Scene Node
         * Do not invoke this method, it's for internal purpose only.
         * @param group the group to unregister its tracked Scene Node from.
         */
        Canvas2D.prototype._unregisterTrackedNode = function (group) {
            if (!group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }
            var i = this._trackedGroups.indexOf(group);
            if (i !== -1) {
                this._trackedGroups.splice(i, 1);
            }
            group._clearFlags(BABYLON.SmartPropertyPrim.flagTrackedGroup);
        };
        /**
         * Get a Solid Color Brush instance matching the given color.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that use the given color
         */
        Canvas2D.GetSolidColorBrush = function (color) {
            return Canvas2D._solidColorBrushes.getOrAddWithFactory(color.toHexString(), function () { return new BABYLON.SolidColorBrush2D(color.clone(), true); });
        };
        /**
         * Get a Solid Color Brush instance matching the given color expressed as a CSS formatted hexadecimal value.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that uses the given color
         */
        Canvas2D.GetSolidColorBrushFromHex = function (hexValue) {
            return Canvas2D._solidColorBrushes.getOrAddWithFactory(hexValue, function () { return new BABYLON.SolidColorBrush2D(BABYLON.Color4.FromHexString(hexValue), true); });
        };
        /**
         * Get a Gradient Color Brush
         * @param color1 starting color
         * @param color2 engine color
         * @param translation translation vector to apply. default is [0;0]
         * @param rotation rotation in radian to apply to the brush, initial direction is top to bottom. rotation is counter clockwise. default is 0.
         * @param scale scaling factor to apply. default is 1.
         */
        Canvas2D.GetGradientColorBrush = function (color1, color2, translation, rotation, scale) {
            if (translation === void 0) { translation = BABYLON.Vector2.Zero(); }
            if (rotation === void 0) { rotation = 0; }
            if (scale === void 0) { scale = 1; }
            return Canvas2D._gradientColorBrushes.getOrAddWithFactory(BABYLON.GradientColorBrush2D.BuildKey(color1, color2, translation, rotation, scale), function () { return new BABYLON.GradientColorBrush2D(color1, color2, translation, rotation, scale, true); });
        };
        /**
         * Create a solid or gradient brush from a string value.
         * @param brushString should be either
         *  - "solid: #RRGGBBAA" or "#RRGGBBAA"
         *  - "gradient: #FF808080, #FFFFFFF[, [10:20], 180, 1]" for color1, color2, translation, rotation (degree), scale. The last three are optionals, but if specified must be is this order. "gradient:" can be omitted.
         */
        Canvas2D.GetBrushFromString = function (brushString) {
            // Note: yes, I hate/don't know RegEx.. Feel free to add your contribution to the cause!
            brushString = brushString.trim();
            var split = brushString.split(",");
            // Solid, formatted as: "[solid:]#FF808080"
            if (split.length === 1) {
                var value = null;
                if (brushString.indexOf("solid:") === 0) {
                    value = brushString.substr(6).trim();
                }
                else if (brushString.indexOf("#") === 0) {
                    value = brushString;
                }
                else {
                    return null;
                }
                return Canvas2D.GetSolidColorBrushFromHex(value);
            }
            else {
                if (split[0].indexOf("gradient:") === 0) {
                    split[0] = split[0].substr(9).trim();
                }
                try {
                    var start = BABYLON.Color4.FromHexString(split[0].trim());
                    var end = BABYLON.Color4.FromHexString(split[1].trim());
                    var t = BABYLON.Vector2.Zero();
                    if (split.length > 2) {
                        var v = split[2].trim();
                        if (v.charAt(0) !== "[" || v.charAt(v.length - 1) !== "]") {
                            return null;
                        }
                        var sep = v.indexOf(":");
                        var x = parseFloat(v.substr(1, sep));
                        var y = parseFloat(v.substr(sep + 1, v.length - (sep + 1)));
                        t = new BABYLON.Vector2(x, y);
                    }
                    var r = 0;
                    if (split.length > 3) {
                        r = BABYLON.Tools.ToRadians(parseFloat(split[3].trim()));
                    }
                    var s = 1;
                    if (split.length > 4) {
                        s = parseFloat(split[4].trim());
                    }
                    return Canvas2D.GetGradientColorBrush(start, end, t, r, s);
                }
                catch (e) {
                    return null;
                }
            }
        };
        /**
         * In this strategy only the direct children groups of the Canvas will be cached, their whole content (whatever the sub groups they have) into a single bitmap.
         * This strategy doesn't allow primitives added directly as children of the Canvas.
         * You typically want to use this strategy of a screenSpace fullscreen canvas: you don't want a bitmap cache taking the whole screen resolution but still want the main contents (say UI in the topLeft and rightBottom for instance) to be efficiently cached.
         */
        Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS = 1;
        /**
         * In this strategy each group will have its own cache bitmap (except if a given group explicitly defines the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors).
         * This strategy is typically used if the canvas has some groups that are frequently animated. Unchanged ones will have a steady cache and the others will be refreshed when they change, reducing the redraw operation count to their content only.
         * When using this strategy, group instances can rely on the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors to minimize the amount of cached bitmaps.
         * Note that in this mode the Canvas itself is not cached, it only contains the sprites of its direct children group to render, there's no point to cache the whole canvas, sprites will be rendered pretty efficiently, the memory cost would be too great for the value of it.
         */
        Canvas2D.CACHESTRATEGY_ALLGROUPS = 2;
        /**
         * In this strategy the whole canvas is cached into a single bitmap containing every primitives it owns, at the exception of the ones that are owned by a group having the DONTCACHEOVERRIDE behavior (these primitives will be directly drawn to the viewport at each render for screenSpace Canvas or be part of the Canvas cache bitmap for worldSpace Canvas).
         */
        Canvas2D.CACHESTRATEGY_CANVAS = 3;
        /**
         * This strategy is used to recompose/redraw the canvas entirely at each viewport render.
         * Use this strategy if memory is a concern above rendering performances and/or if the canvas is frequently animated (hence reducing the benefits of caching).
         * Note that you can't use this strategy for WorldSpace Canvas, they need at least a top level group caching.
         */
        Canvas2D.CACHESTRATEGY_DONTCACHE = 4;
        /**
         * Observable Mask to be notified before rendering is made
         */
        Canvas2D.RENDEROBSERVABLE_PRE = 1;
        /**
         * Observable Mask to be notified after rendering is made
         */
        Canvas2D.RENDEROBSERVABLE_POST = 2;
        Canvas2D._INSTANCES = [];
        Canvas2D._zMinDelta = 1 / (Math.pow(2, 24) - 1);
        Canvas2D._interInfo = new BABYLON.IntersectInfo2D();
        Canvas2D._v = BABYLON.Vector3.Zero(); // Must stay zero
        Canvas2D._m = BABYLON.Matrix.Identity();
        Canvas2D._mI = BABYLON.Matrix.Identity(); // Must stay identity
        Canvas2D._unS = new BABYLON.Vector2(1, 1);
        /**
         * Define the default size used for both the width and height of a MapTexture to allocate.
         * Note that some MapTexture might be bigger than this size if the first node to allocate is bigger in width or height
         */
        Canvas2D._groupTextureCacheSize = 1024;
        Canvas2D._solidColorBrushes = new BABYLON.StringDictionary();
        Canvas2D._gradientColorBrushes = new BABYLON.StringDictionary();
        Canvas2D = __decorate([
            BABYLON.className("Canvas2D", "BABYLON")
        ], Canvas2D);
        return Canvas2D;
    }(BABYLON.Group2D));
    BABYLON.Canvas2D = Canvas2D;
    var WorldSpaceCanvas2D = (function (_super) {
        __extends(WorldSpaceCanvas2D, _super);
        /**
         * Create a new 2D WorldSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a world transformation information to place it in the world space.
         * This kind of canvas can't have its Primitives directly drawn in the Viewport, they need to be cached in a bitmap at some point, as a consequence the DONT_CACHE strategy is unavailable. For now only CACHESTRATEGY_CANVAS is supported, but the remaining strategies will be soon.
         * @param scene the Scene that owns the Canvas
         * @param size the dimension of the Canvas in World Space
         * @param settings a combination of settings, possible ones are
         *  - children: an array of direct children primitives
         *  - id: a text identifier, for information purpose only, default is null.
         *  - worldPosition the position of the Canvas in World Space, default is [0,0,0]
         *  - worldRotation the rotation of the Canvas in World Space, default is Quaternion.Identity()
         * - sideOrientation: Unexpected behavior occur if the value is different from Mesh.DEFAULTSIDE right now, so please use this one, which is the default.
         * - cachingStrategy Must be CACHESTRATEGY_CANVAS for now, which is the default.
         * - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is false (the opposite of ScreenSpace).
         * - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         * - backgroundRoundRadius: the round radius of the background, either backgroundFill or backgroundBorder must be specified.
         * - backgroundFill: the brush to use to create a background fill for the canvas. can be a string value (see Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorder: the brush to use to create a background border for the canvas. can be a string value (see Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorderThickness: if a backgroundBorder is specified, its thickness can be set using this property
         * - customWorldSpaceNode: if specified the Canvas will be rendered in this given Node. But it's the responsibility of the caller to set the "worldSpaceToNodeLocal" property to compute the hit of the mouse ray into the node (in world coordinate system) as well as rendering the cached bitmap in the node itself. The properties cachedRect and cachedTexture of Group2D will give you what you need to do that.
         * - maxAdaptiveCanvasSize: set the max size (width and height) of the bitmap that will contain the cached version of the WorldSpace Canvas. Default is 1024 or less if it's not supported. In any case the value you give will be clipped by the maximum that WebGL supports on the running device. You can set any size, more than 1024 if you want, but testing proved it's a good max value for non "retina" like screens.
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function WorldSpaceCanvas2D(scene, size, settings) {
            var _this = this;
            BABYLON.Prim2DBase._isCanvasInit = true;
            var s = settings;
            s.isScreenSpace = false;
            s.size = size.clone();
            settings.cachingStrategy = (settings.cachingStrategy == null) ? Canvas2D.CACHESTRATEGY_CANVAS : settings.cachingStrategy;
            if (settings.cachingStrategy !== Canvas2D.CACHESTRATEGY_CANVAS) {
                throw new Error("Right now only the CACHESTRATEGY_CANVAS cache Strategy is supported for WorldSpace Canvas. More will come soon!");
            }
            _super.call(this, scene, settings);
            BABYLON.Prim2DBase._isCanvasInit = false;
            this._renderableData._useMipMap = true;
            this._renderableData._anisotropicLevel = 8;
            //if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
            //    throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            //}
            var createWorldSpaceNode = !settings || (settings.customWorldSpaceNode == null);
            var id = settings ? settings.id || null : null;
            // Set the max size of texture allowed for the adaptive render of the world space canvas cached bitmap
            var capMaxTextSize = this.engine.getCaps().maxRenderTextureSize;
            var defaultTextSize = (Math.min(capMaxTextSize, 1024)); // Default is 4K if allowed otherwise the max allowed
            if (settings.maxAdaptiveCanvasSize == null) {
                this._maxAdaptiveWorldSpaceCanvasSize = defaultTextSize;
            }
            else {
                // We still clip the given value with the max allowed, the user may not be aware of these limitations
                this._maxAdaptiveWorldSpaceCanvasSize = Math.min(settings.maxAdaptiveCanvasSize, capMaxTextSize);
            }
            if (createWorldSpaceNode) {
                var plane = new BABYLON.WorldSpaceCanvas2DNode(id, scene, this);
                var vertexData = BABYLON.VertexData.CreatePlane({
                    width: size.width,
                    height: size.height,
                    sideOrientation: settings && settings.sideOrientation || BABYLON.Mesh.DEFAULTSIDE
                });
                var mtl = new BABYLON.StandardMaterial(id + "_Material", scene);
                this.applyCachedTexture(vertexData, mtl);
                vertexData.applyToMesh(plane, true);
                mtl.specularColor = new BABYLON.Color3(0, 0, 0);
                mtl.disableLighting = true;
                mtl.useAlphaFromDiffuseTexture = true;
                plane.position = settings && settings.worldPosition || BABYLON.Vector3.Zero();
                plane.rotationQuaternion = settings && settings.worldRotation || BABYLON.Quaternion.Identity();
                plane.material = mtl;
                this._worldSpaceNode = plane;
            }
            else {
                this._worldSpaceNode = settings.customWorldSpaceNode;
                this.applyCachedTexture(null, null);
            }
            this.propertyChanged.add(function (e, st) {
                var mesh = _this._worldSpaceNode;
                if (mesh) {
                    mesh.isVisible = _this.isVisible;
                }
            }, BABYLON.Prim2DBase.isVisibleProperty.flagId);
        }
        WorldSpaceCanvas2D = __decorate([
            BABYLON.className("WorldSpaceCanvas2D", "BABYLON")
        ], WorldSpaceCanvas2D);
        return WorldSpaceCanvas2D;
    }(Canvas2D));
    BABYLON.WorldSpaceCanvas2D = WorldSpaceCanvas2D;
    var ScreenSpaceCanvas2D = (function (_super) {
        __extends(ScreenSpaceCanvas2D, _super);
        /**
         * Create a new 2D ScreenSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a position relative to the bottom/left corner of the screen.
         * ScreenSpace Canvas will be drawn in the Viewport as a 2D Layer lying to the top of the 3D Scene. Typically used for traditional UI.
         * All caching strategies will be available.
         * PLEASE NOTE: the origin of a Screen Space Canvas is set to [0;0] (bottom/left) which is different than the default origin of a Primitive which is centered [0.5;0.5]
         * @param scene the Scene that owns the Canvas
         * @param settings a combination of settings, possible ones are
         *  - children: an array of direct children primitives
         *  - id: a text identifier, for information purpose only
         *  - x: the position along the x axis (horizontal), relative to the left edge of the viewport. you can alternatively use the position setting.
         *  - y: the position along the y axis (vertically), relative to the bottom edge of the viewport. you can alternatively use the position setting.
         *  - position: the position of the canvas, relative from the bottom/left of the scene's viewport. Alternatively you can set the x and y properties directly. Default value is [0, 0]
         *  - width: the width of the Canvas. you can alternatively use the size setting.
         *  - height: the height of the Canvas. you can alternatively use the size setting.
         *  - size: the Size of the canvas. Alternatively the width and height properties can be set. If null two behaviors depend on the cachingStrategy: if it's CACHESTRATEGY_CACHECANVAS then it will always auto-fit the rendering device, in all the other modes it will fit the content of the Canvas
         *  - designSize: if you want to set the canvas content based on fixed coordinates whatever the final canvas dimension would be, set this. For instance a designSize of 360*640 will give you the possibility to specify all the children element in this frame. The Canvas' true size will be the HTMLCanvas' size: for instance it could be 720*1280, then a uniform scale of 2 will be applied on the Canvas to keep the absolute coordinates working as expecting. If the ratios of the designSize and the true Canvas size are not the same, then the scale is computed following the designUseHorizAxis member by using either the size of the horizontal axis or the vertical axis.
         *  - designUseHorizAxis: you can set this member if you use designSize to specify which axis is priority to compute the scale when the ratio of the canvas' size is different from the designSize's one.
         *  - cachingStrategy: either CACHESTRATEGY_TOPLEVELGROUPS, CACHESTRATEGY_ALLGROUPS, CACHESTRATEGY_CANVAS, CACHESTRATEGY_DONTCACHE. Please refer to their respective documentation for more information. Default is Canvas2D.CACHESTRATEGY_DONTCACHE
         *  - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is true.
         *  - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         * - backgroundRoundRadius: the round radius of the background, either backgroundFill or backgroundBorder must be specified.
         * - backgroundFill: the brush to use to create a background fill for the canvas. can be a string value (see BABYLON.Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorder: the brush to use to create a background border for the canvas. can be a string value (see BABYLON.Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorderThickness: if a backgroundBorder is specified, its thickness can be set using this property
         * - customWorldSpaceNode: if specified the Canvas will be rendered in this given Node. But it's the responsibility of the caller to set the "worldSpaceToNodeLocal" property to compute the hit of the mouse ray into the node (in world coordinate system) as well as rendering the cached bitmap in the node itself. The properties cachedRect and cachedTexture of Group2D will give you what you need to do that.
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see BABYLON.PrimitiveThickness.fromString)
         */
        function ScreenSpaceCanvas2D(scene, settings) {
            BABYLON.Prim2DBase._isCanvasInit = true;
            _super.call(this, scene, settings);
        }
        ScreenSpaceCanvas2D = __decorate([
            BABYLON.className("ScreenSpaceCanvas2D", "BABYLON")
        ], ScreenSpaceCanvas2D);
        return ScreenSpaceCanvas2D;
    }(Canvas2D));
    BABYLON.ScreenSpaceCanvas2D = ScreenSpaceCanvas2D;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    /**
     * This is the class that is used to display a World Space Canvas into a 3D scene
     */
    var WorldSpaceCanvas2DNode = (function (_super) {
        __extends(WorldSpaceCanvas2DNode, _super);
        function WorldSpaceCanvas2DNode(name, scene, canvas) {
            _super.call(this, name, scene);
            this._canvas = canvas;
        }
        WorldSpaceCanvas2DNode.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            if (this._canvas) {
                this._canvas.dispose();
                this._canvas = null;
            }
        };
        return WorldSpaceCanvas2DNode;
    }(BABYLON.Mesh));
    BABYLON.WorldSpaceCanvas2DNode = WorldSpaceCanvas2DNode;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Command = (function () {
        function Command(execute, canExecute) {
            if (!execute) {
                throw Error("At least an execute lambda must be given at Command creation time");
            }
            this._canExecuteChanged = null;
            this._lastCanExecuteResult = null;
            this.execute = execute;
            this.canExecute = canExecute;
        }
        Command.prototype.canExecute = function (parameter) {
            var res = true;
            if (this._canExecute) {
                res = this._canExecute(parameter);
            }
            if (res !== this._lastCanExecuteResult) {
                if (this._canExecuteChanged && this._canExecuteChanged.hasObservers()) {
                    this._canExecuteChanged.notifyObservers(null);
                }
                this._lastCanExecuteResult = res;
            }
            return res;
        };
        Command.prototype.execute = function (parameter) {
            this._execute(parameter);
        };
        Object.defineProperty(Command.prototype, "canExecuteChanged", {
            get: function () {
                if (!this._canExecuteChanged) {
                    this._canExecuteChanged = new BABYLON.Observable();
                }
                return this._canExecuteChanged;
            },
            enumerable: true,
            configurable: true
        });
        return Command;
    }());
    BABYLON.Command = Command;
    var UIElement = (function (_super) {
        __extends(UIElement, _super);
        function UIElement(settings) {
            _super.call(this);
            if (!settings) {
                throw Error("A settings object must be passed with at least either a parent or owner parameter");
            }
            var type = BABYLON.Tools.getFullClassName(this);
            this._ownerWindow = null;
            this._parent = null;
            this._visualPlaceholder = null;
            this._visualTemplateRoot = null;
            this._visualChildrenPlaceholder = null;
            this._hierarchyDepth = 0;
            this._style = (settings.styleName != null) ? UIElementStyleManager.getStyle(type, settings.styleName) : null;
            this._flags = 0;
            this._id = (settings.id != null) ? settings.id : null;
            this._uid = null;
            this._width = (settings.width != null) ? settings.width : null;
            this._height = (settings.height != null) ? settings.height : null;
            this._minWidth = (settings.minWidth != null) ? settings.minWidth : 0;
            this._minHeight = (settings.minHeight != null) ? settings.minHeight : 0;
            this._maxWidth = (settings.maxWidth != null) ? settings.maxWidth : Number.MAX_VALUE;
            this._maxHeight = (settings.maxHeight != null) ? settings.maxHeight : Number.MAX_VALUE;
            this._margin = null;
            this._padding = null;
            this._marginAlignment = null;
            this._isEnabled = true;
            this._isFocused = false;
            this._isMouseOver = false;
            // Default Margin Alignment for UIElement is stretch for horizontal/vertical and not left/bottom (which is the default for Canvas2D Primitives)
            //this.marginAlignment.horizontal = PrimitiveAlignment.AlignStretch;
            //this.marginAlignment.vertical   = PrimitiveAlignment.AlignStretch;
            // Set the layout/margin stuffs
            if (settings.marginTop) {
                this.margin.setTop(settings.marginTop);
            }
            if (settings.marginLeft) {
                this.margin.setLeft(settings.marginLeft);
            }
            if (settings.marginRight) {
                this.margin.setRight(settings.marginRight);
            }
            if (settings.marginBottom) {
                this.margin.setBottom(settings.marginBottom);
            }
            if (settings.margin) {
                if (typeof settings.margin === "string") {
                    this.margin.fromString(settings.margin);
                }
                else {
                    this.margin.fromUniformPixels(settings.margin);
                }
            }
            if (settings.marginHAlignment) {
                this.marginAlignment.horizontal = settings.marginHAlignment;
            }
            if (settings.marginVAlignment) {
                this.marginAlignment.vertical = settings.marginVAlignment;
            }
            if (settings.marginAlignment) {
                this.marginAlignment.fromString(settings.marginAlignment);
            }
            if (settings.paddingTop) {
                this.padding.setTop(settings.paddingTop);
            }
            if (settings.paddingLeft) {
                this.padding.setLeft(settings.paddingLeft);
            }
            if (settings.paddingRight) {
                this.padding.setRight(settings.paddingRight);
            }
            if (settings.paddingBottom) {
                this.padding.setBottom(settings.paddingBottom);
            }
            if (settings.padding) {
                this.padding.fromString(settings.padding);
            }
            this._assignTemplate(settings.templateName);
            if (settings.parent != null) {
                this._parent = settings.parent;
                this._hierarchyDepth = this._parent._hierarchyDepth + 1;
            }
        }
        UIElement.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            if (this._renderingTemplate) {
                this._renderingTemplate.detach();
                this._renderingTemplate = null;
            }
            _super.prototype.dispose.call(this);
            // Don't set to null, it may upset somebody...
            this.animations.splice(0);
            return true;
        };
        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        UIElement.prototype.getAnimatables = function () {
            return new Array();
        };
        Object.defineProperty(UIElement.prototype, "ownerWindows", {
            // TODO
            // PROPERTIES
            // Style
            // Id
            // Parent/Children
            // ActualWidth/Height, MinWidth/Height, MaxWidth/Height,
            // Alignment/Margin
            // Visibility, IsVisible
            // IsEnabled (is false, control is disabled, no interaction and a specific render state)
            // CacheMode of Visual Elements
            // Focusable/IsFocused
            // IsPointerCaptured, CapturePointer, IsPointerDirectlyOver, IsPointerOver. De-correlate mouse, stylus, touch?
            // ContextMenu
            // Cursor
            // DesiredSize
            // IsInputEnable ?
            // Opacity, OpacityMask ?
            // SnapToDevicePixels
            // Tag
            // ToolTip
            // METHODS
            // BringIntoView (for scrollable content, to move the scroll to bring the given element visible in the parent's area)
            // Capture/ReleaseCapture (mouse, touch, stylus)
            // Focus
            // PointFrom/ToScreen to translate coordinates
            // EVENTS
            // ContextMenuOpening/Closing/Changed
            // DragEnter/LeaveOver, Drop
            // Got/LostFocus
            // IsEnabledChanged
            // IsPointerOver/DirectlyOverChanged
            // IsVisibleChanged
            // KeyDown/Up
            // LayoutUpdated ?
            // Pointer related events
            // SizeChanged
            // ToolTipOpening/Closing
            get: function () {
                return this._ownerWindow;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "style", {
            get: function () {
                if (!this.style) {
                    return UIElementStyleManager.DefaultStyleName;
                }
                return this._style.name;
            },
            set: function (value) {
                if (this._style && (this._style.name === value)) {
                    return;
                }
                var newStyle = null;
                if (value) {
                    newStyle = UIElementStyleManager.getStyle(BABYLON.Tools.getFullClassName(this), value);
                    if (!newStyle) {
                        throw Error("Couldn't find Style " + value + " for UIElement " + BABYLON.Tools.getFullClassName(this));
                    }
                }
                if (this._style) {
                    this._style.removeStyle(this);
                }
                if (newStyle) {
                    newStyle.applyStyle(this);
                }
                this._style = newStyle;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "id", {
            /**
             * A string that identifies the UIElement.
             * The id is optional and there's possible collision with other UIElement's id as the uniqueness is not supported.
             */
            get: function () {
                return this._id;
            },
            set: function (value) {
                if (this._id === value) {
                    return;
                }
                this._id = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "uid", {
            /**
             * Return a unique id automatically generated.
             * This property is mainly used for serialization to ensure a perfect way of identifying a UIElement
             */
            get: function () {
                if (!this._uid) {
                    this._uid = BABYLON.Tools.RandomId();
                }
                return this._uid;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "hierarchyDepth", {
            get: function () {
                return this._hierarchyDepth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            set: function (value) {
                this._parent = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                this._width = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                this._height = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "minWidth", {
            get: function () {
                return this._minWidth;
            },
            set: function (value) {
                this._minWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "minHheight", {
            get: function () {
                return this._minHeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "minHeight", {
            set: function (value) {
                this._minHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "maxWidth", {
            get: function () {
                return this._maxWidth;
            },
            set: function (value) {
                this._maxWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "maxHeight", {
            get: function () {
                return this._maxHeight;
            },
            set: function (value) {
                this._maxHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "actualWidth", {
            get: function () {
                return this._actualWidth;
            },
            set: function (value) {
                this._actualWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "actualHeight", {
            get: function () {
                return this._actualHeight;
            },
            set: function (value) {
                this._actualHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "margin", {
            get: function () {
                var _this = this;
                if (!this._margin) {
                    this._margin = new BABYLON.PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.margin;
                    });
                }
                return this._margin;
            },
            set: function (value) {
                this.margin.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasMargin", {
            get: function () {
                return (this._margin !== null && !this._margin.isDefault) || (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "padding", {
            get: function () {
                var _this = this;
                if (!this._padding) {
                    this._padding = new BABYLON.PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.padding;
                    });
                }
                return this._padding;
            },
            set: function (value) {
                this.padding.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasPadding", {
            get: function () {
                return this._padding !== null && !this._padding.isDefault;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "marginAlignment", {
            get: function () {
                if (!this._marginAlignment) {
                    this._marginAlignment = new BABYLON.PrimitiveAlignment();
                }
                return this._marginAlignment;
            },
            set: function (value) {
                this.marginAlignment.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasMarginAlignment", {
            /**
             * Check if there a marginAlignment specified (non null and not default)
             */
            get: function () {
                return (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isEnabled", {
            get: function () {
                return this._isEnabled;
            },
            set: function (value) {
                this._isEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isFocused", {
            get: function () {
                return this._isFocused;
            },
            set: function (value) {
                this._isFocused = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isMouseOver", {
            get: function () {
                return this._isMouseOver;
            },
            set: function (value) {
                this._isMouseOver = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        UIElement.prototype._isFlagSet = function (flag) {
            return (this._flags & flag) !== 0;
        };
        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        UIElement.prototype._areAllFlagsSet = function (flags) {
            return (this._flags & flags) === flags;
        };
        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        UIElement.prototype._areSomeFlagsSet = function (flags) {
            return (this._flags & flags) !== 0;
        };
        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        UIElement.prototype._clearFlags = function (flags) {
            this._flags &= ~flags;
        };
        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        UIElement.prototype._setFlags = function (flags) {
            var cur = this._flags;
            this._flags |= flags;
            return cur;
        };
        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        UIElement.prototype._changeFlags = function (flags, state) {
            if (state) {
                this._flags |= flags;
            }
            else {
                this._flags &= ~flags;
            }
        };
        UIElement.prototype._assignTemplate = function (templateName) {
            if (!templateName) {
                templateName = UIElementRenderingTemplateManager.DefaultTemplateName;
            }
            var className = BABYLON.Tools.getFullClassName(this);
            if (!className) {
                throw Error("Couldn't access class name of this UIElement, you have to decorate the type with the className decorator");
            }
            var factory = UIElementRenderingTemplateManager.getRenderingTemplate(className, templateName);
            if (!factory) {
                throw Error("Couldn't get the renderingTemplate " + templateName + " of class " + className);
            }
            this._renderingTemplate = factory();
            this._renderingTemplate.attach(this);
        };
        UIElement.prototype._createVisualTree = function () {
            var parentPrim = this.ownerWindows.canvas;
            if (this.parent) {
                parentPrim = this.parent.visualChildrenPlaceholder;
            }
            this._visualPlaceholder = new BABYLON.Group2D({ parent: parentPrim, id: "GUI Visual Placeholder of " + this.id });
            var p = this._visualPlaceholder;
            p.addExternalData("_GUIOwnerElement_", this);
            p.dataSource = this;
            p.createSimpleDataBinding(BABYLON.Prim2DBase.widthProperty, "width", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.heightProperty, "height", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.actualWidthProperty, "actualWidth", BABYLON.DataBinding.MODE_ONEWAYTOSOURCE);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.actualHeightProperty, "actualHeight", BABYLON.DataBinding.MODE_ONEWAYTOSOURCE);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginProperty, "margin", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.paddingProperty, "padding", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginAlignmentProperty, "marginAlignment", BABYLON.DataBinding.MODE_ONEWAY);
            this.createVisualTree();
        };
        UIElement.prototype._patchUIElement = function (ownerWindow, parent) {
            if (ownerWindow) {
                if (!this._ownerWindow) {
                    ownerWindow._registerVisualToBuild(this);
                }
                this._ownerWindow = ownerWindow;
            }
            this._parent = parent;
            if (parent) {
                this._hierarchyDepth = parent.hierarchyDepth + 1;
            }
            var children = this._getChildren();
            if (children) {
                for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                    var curChild = children_1[_i];
                    curChild._patchUIElement(ownerWindow, this);
                }
            }
        };
        // Overload the SmartPropertyBase's method to provide the additional logic of returning the parent's dataSource if there's no dataSource specified at this level.
        UIElement.prototype._getDataSource = function () {
            var levelDS = _super.prototype._getDataSource.call(this);
            if (levelDS != null) {
                return levelDS;
            }
            var p = this.parent;
            if (p != null) {
                return p.dataSource;
            }
            return null;
        };
        UIElement.prototype.createVisualTree = function () {
            var res = this._renderingTemplate.createVisualTree(this, this._visualPlaceholder);
            this._visualTemplateRoot = res.root;
            this._visualChildrenPlaceholder = res.contentPlaceholder;
        };
        Object.defineProperty(UIElement.prototype, "visualPlaceholder", {
            get: function () {
                return this._visualPlaceholder;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "visualTemplateRoot", {
            get: function () {
                return this._visualTemplateRoot;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "visualChildrenPlaceholder", {
            get: function () {
                return this._visualChildrenPlaceholder;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_position", {
            get: function () { return null; } // TODO use abstract keyword when TS 2.0 will be approved
            ,
            enumerable: true,
            configurable: true
        });
        UIElement.UIELEMENT_PROPCOUNT = 15;
        UIElement.flagVisualToBuild = 0x0000001; // set if the UIElement visual must be updated
        __decorate([
            BABYLON.dependencyProperty(0, function (pi) { return UIElement.parentProperty = pi; })
        ], UIElement.prototype, "parent", null);
        __decorate([
            BABYLON.dependencyProperty(1, function (pi) { return UIElement.widthProperty = pi; })
        ], UIElement.prototype, "width", null);
        __decorate([
            BABYLON.dependencyProperty(2, function (pi) { return UIElement.heightProperty = pi; })
        ], UIElement.prototype, "height", null);
        __decorate([
            BABYLON.dependencyProperty(3, function (pi) { return UIElement.minWidthProperty = pi; })
        ], UIElement.prototype, "minWidth", null);
        __decorate([
            BABYLON.dependencyProperty(4, function (pi) { return UIElement.minHeightProperty = pi; })
        ], UIElement.prototype, "minHheight", null);
        __decorate([
            BABYLON.dependencyProperty(5, function (pi) { return UIElement.maxWidthProperty = pi; })
        ], UIElement.prototype, "maxWidth", null);
        __decorate([
            BABYLON.dependencyProperty(6, function (pi) { return UIElement.maxHeightProperty = pi; })
        ], UIElement.prototype, "maxHeight", null);
        __decorate([
            BABYLON.dependencyProperty(7, function (pi) { return UIElement.actualWidthProperty = pi; })
        ], UIElement.prototype, "actualWidth", null);
        __decorate([
            BABYLON.dependencyProperty(8, function (pi) { return UIElement.actualHeightProperty = pi; })
        ], UIElement.prototype, "actualHeight", null);
        __decorate([
            BABYLON.dynamicLevelProperty(9, function (pi) { return UIElement.marginProperty = pi; })
        ], UIElement.prototype, "margin", null);
        __decorate([
            BABYLON.dynamicLevelProperty(10, function (pi) { return UIElement.paddingProperty = pi; })
        ], UIElement.prototype, "padding", null);
        __decorate([
            BABYLON.dynamicLevelProperty(11, function (pi) { return UIElement.marginAlignmentProperty = pi; })
        ], UIElement.prototype, "marginAlignment", null);
        __decorate([
            BABYLON.dynamicLevelProperty(12, function (pi) { return UIElement.isEnabledProperty = pi; })
        ], UIElement.prototype, "isEnabled", null);
        __decorate([
            BABYLON.dynamicLevelProperty(13, function (pi) { return UIElement.isFocusedProperty = pi; })
        ], UIElement.prototype, "isFocused", null);
        __decorate([
            BABYLON.dynamicLevelProperty(14, function (pi) { return UIElement.isMouseOverProperty = pi; })
        ], UIElement.prototype, "isMouseOver", null);
        return UIElement;
    }(BABYLON.SmartPropertyBase));
    BABYLON.UIElement = UIElement;
    var UIElementStyle = (function () {
        function UIElementStyle() {
        }
        Object.defineProperty(UIElementStyle.prototype, "name", {
            get: function () { return null; } // TODO use abstract keyword when TS 2.0 will be approved
            ,
            enumerable: true,
            configurable: true
        });
        return UIElementStyle;
    }());
    BABYLON.UIElementStyle = UIElementStyle;
    var UIElementStyleManager = (function () {
        function UIElementStyleManager() {
        }
        UIElementStyleManager.getStyle = function (uiElType, styleName) {
            var styles = UIElementStyleManager.stylesByUIElement.get(uiElType);
            if (!styles) {
                throw Error("The type " + uiElType + " is unknown, no style were registered for it.");
            }
            var style = styles.get(styleName);
            if (!style) {
                throw Error("Couldn't find Template " + styleName + " of UIElement type " + uiElType);
            }
            return style;
        };
        UIElementStyleManager.registerStyle = function (uiElType, templateName, style) {
            var templates = UIElementStyleManager.stylesByUIElement.getOrAddWithFactory(uiElType, function () { return new BABYLON.StringDictionary(); });
            if (templates.contains(templateName)) {
                templates[templateName] = style;
            }
            else {
                templates.add(templateName, style);
            }
        };
        Object.defineProperty(UIElementStyleManager, "DefaultStyleName", {
            get: function () {
                return UIElementStyleManager._defaultStyleName;
            },
            set: function (value) {
                UIElementStyleManager._defaultStyleName = value;
            },
            enumerable: true,
            configurable: true
        });
        UIElementStyleManager.stylesByUIElement = new BABYLON.StringDictionary();
        UIElementStyleManager._defaultStyleName = "Default";
        return UIElementStyleManager;
    }());
    BABYLON.UIElementStyleManager = UIElementStyleManager;
    var UIElementRenderingTemplateManager = (function () {
        function UIElementRenderingTemplateManager() {
        }
        UIElementRenderingTemplateManager.getRenderingTemplate = function (uiElType, templateName) {
            var templates = UIElementRenderingTemplateManager.renderingTemplatesByUIElement.get(uiElType);
            if (!templates) {
                throw Error("The type " + uiElType + " is unknown, no Rendering Template were registered for it.");
            }
            var templateFactory = templates.get(templateName);
            if (!templateFactory) {
                throw Error("Couldn't find Template " + templateName + " of UI Element type " + uiElType);
            }
            return templateFactory;
        };
        UIElementRenderingTemplateManager.registerRenderingTemplate = function (uiElType, templateName, factory) {
            var templates = UIElementRenderingTemplateManager.renderingTemplatesByUIElement.getOrAddWithFactory(uiElType, function () { return new BABYLON.StringDictionary(); });
            if (templates.contains(templateName)) {
                templates[templateName] = factory;
            }
            else {
                templates.add(templateName, factory);
            }
        };
        Object.defineProperty(UIElementRenderingTemplateManager, "DefaultTemplateName", {
            get: function () {
                return UIElementRenderingTemplateManager._defaultTemplateName;
            },
            set: function (value) {
                UIElementRenderingTemplateManager._defaultTemplateName = value;
            },
            enumerable: true,
            configurable: true
        });
        UIElementRenderingTemplateManager.renderingTemplatesByUIElement = new BABYLON.StringDictionary();
        UIElementRenderingTemplateManager._defaultTemplateName = "Default";
        return UIElementRenderingTemplateManager;
    }());
    BABYLON.UIElementRenderingTemplateManager = UIElementRenderingTemplateManager;
    var UIElementRenderingTemplateBase = (function () {
        function UIElementRenderingTemplateBase() {
        }
        UIElementRenderingTemplateBase.prototype.attach = function (owner) {
            this._owner = owner;
        };
        UIElementRenderingTemplateBase.prototype.detach = function () {
        };
        Object.defineProperty(UIElementRenderingTemplateBase.prototype, "owner", {
            get: function () {
                return this._owner;
            },
            enumerable: true,
            configurable: true
        });
        return UIElementRenderingTemplateBase;
    }());
    BABYLON.UIElementRenderingTemplateBase = UIElementRenderingTemplateBase;
    function registerWindowRenderingTemplate(uiElType, templateName, factory) {
        return function () {
            UIElementRenderingTemplateManager.registerRenderingTemplate(uiElType, templateName, factory);
        };
    }
    BABYLON.registerWindowRenderingTemplate = registerWindowRenderingTemplate;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Control = (function (_super) {
        __extends(Control, _super);
        function Control(settings) {
            _super.call(this, settings);
        }
        Object.defineProperty(Control.prototype, "background", {
            get: function () {
                if (!this._background) {
                    this._background = new BABYLON.ObservableStringDictionary(false);
                }
                return this._background;
            },
            set: function (value) {
                this.background.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "border", {
            get: function () {
                return this._border;
            },
            set: function (value) {
                this._border = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "borderThickness", {
            get: function () {
                return this._borderThickness;
            },
            set: function (value) {
                this._borderThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "fontName", {
            get: function () {
                return this._fontName;
            },
            set: function (value) {
                this._fontName = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "foreground", {
            get: function () {
                return this._foreground;
            },
            set: function (value) {
                this._foreground = value;
            },
            enumerable: true,
            configurable: true
        });
        Control.CONTROL_PROPCOUNT = BABYLON.UIElement.UIELEMENT_PROPCOUNT + 5;
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 0, function (pi) { return Control.backgroundProperty = pi; })
        ], Control.prototype, "background", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 1, function (pi) { return Control.borderProperty = pi; })
        ], Control.prototype, "border", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 2, function (pi) { return Control.borderThicknessProperty = pi; })
        ], Control.prototype, "borderThickness", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 3, function (pi) { return Control.fontNameProperty = pi; })
        ], Control.prototype, "fontName", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 4, function (pi) { return Control.foregroundProperty = pi; })
        ], Control.prototype, "foreground", null);
        Control = __decorate([
            BABYLON.className("Control", "BABYLON")
        ], Control);
        return Control;
    }(BABYLON.UIElement));
    BABYLON.Control = Control;
    var ContentControl = (function (_super) {
        __extends(ContentControl, _super);
        function ContentControl(settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            if (settings.content != null) {
                this._content = settings.content;
            }
            if (settings.contentAlignment != null) {
                this.contentAlignment.fromString(settings.contentAlignment);
            }
        }
        ContentControl.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            if (this.content && this.content.dispose) {
                this.content.dispose();
                this.content = null;
            }
            if (this.__contentUIElement) {
                this.__contentUIElement.dispose();
                this.__contentUIElement = null;
            }
            _super.prototype.dispose.call(this);
            return true;
        };
        Object.defineProperty(ContentControl.prototype, "content", {
            get: function () {
                return this._content;
            },
            set: function (value) {
                this._content = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ContentControl.prototype, "contentAlignment", {
            get: function () {
                if (!this._contentAlignment) {
                    this._contentAlignment = new BABYLON.PrimitiveAlignment();
                }
                return this._contentAlignment;
            },
            set: function (value) {
                this.contentAlignment.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ContentControl.prototype, "_hasContentAlignment", {
            /**
             * Check if there a contentAlignment specified (non null and not default)
             */
            get: function () {
                return (this._contentAlignment !== null && !this._contentAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ContentControl.prototype, "_contentUIElement", {
            get: function () {
                if (!this.__contentUIElement) {
                    this._buildContentUIElement();
                }
                return this.__contentUIElement;
            },
            enumerable: true,
            configurable: true
        });
        ContentControl.prototype._buildContentUIElement = function () {
            var c = this._content;
            this.__contentUIElement = null;
            // Already a UIElement
            if (c instanceof BABYLON.UIElement) {
                this.__contentUIElement = c;
            }
            else if ((typeof c === "string") || (typeof c === "boolean") || (typeof c === "number")) {
                var l = new BABYLON.Label({ parent: this, id: "Content of " + this.id });
                var binding = new BABYLON.DataBinding();
                binding.propertyPathName = "content";
                binding.stringFormat = function (v) { return ("" + v); };
                binding.dataSource = this;
                l.createDataBinding(BABYLON.Label.textProperty, binding);
                binding = new BABYLON.DataBinding();
                binding.propertyPathName = "contentAlignment";
                binding.dataSource = this;
                l.createDataBinding(BABYLON.Label.marginAlignmentProperty, binding);
                this.__contentUIElement = l;
            }
            else {
            }
            if (this.__contentUIElement) {
                this.__contentUIElement._patchUIElement(this.ownerWindows, this);
            }
        };
        ContentControl.prototype._getChildren = function () {
            var children = new Array();
            if (this.content) {
                children.push(this._contentUIElement);
            }
            return children;
        };
        ContentControl.CONTENTCONTROL_PROPCOUNT = Control.CONTROL_PROPCOUNT + 2;
        __decorate([
            BABYLON.dependencyProperty(Control.CONTROL_PROPCOUNT + 0, function (pi) { return ContentControl.contentProperty = pi; })
        ], ContentControl.prototype, "content", null);
        __decorate([
            BABYLON.dependencyProperty(Control.CONTROL_PROPCOUNT + 1, function (pi) { return ContentControl.contentAlignmentProperty = pi; })
        ], ContentControl.prototype, "contentAlignment", null);
        ContentControl = __decorate([
            BABYLON.className("ContentControl", "BABYLON")
        ], ContentControl);
        return ContentControl;
    }(Control));
    BABYLON.ContentControl = ContentControl;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Window = (function (_super) {
        __extends(Window, _super);
        function Window(scene, settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            if (!this._UIElementVisualToBuildList) {
                this._UIElementVisualToBuildList = new Array();
            }
            // Patch the owner and also the parent property through the whole tree
            this._patchUIElement(this, null);
            // Screen Space UI
            if (!settings.worldPosition && !settings.worldRotation) {
                this._canvas = Window.getScreenCanvas(scene);
                this._isWorldSpaceCanvas = false;
                this._left = (settings.left != null) ? settings.left : 0;
                this._bottom = (settings.bottom != null) ? settings.bottom : 0;
            }
            else {
                var w = (settings.width == null) ? 100 : settings.width;
                var h = (settings.height == null) ? 100 : settings.height;
                var wpos = (settings.worldPosition == null) ? BABYLON.Vector3.Zero() : settings.worldPosition;
                var wrot = (settings.worldRotation == null) ? BABYLON.Quaternion.Identity() : settings.worldRotation;
                this._canvas = new BABYLON.WorldSpaceCanvas2D(scene, new BABYLON.Size(w, h), { id: "GUI Canvas", cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_DONTCACHE, worldPosition: wpos, worldRotation: wrot });
                this._isWorldSpaceCanvas = true;
            }
            this._renderObserver = this._canvas.renderObservable.add(function (e, s) { return _this._canvasPreRender(); }, BABYLON.Canvas2D.RENDEROBSERVABLE_PRE);
            this._disposeObserver = this._canvas.disposeObservable.add(function (e, s) { return _this._canvasDisposed(); });
            this._canvas.propertyChanged.add(function (e, s) {
                if (e.propertyName === "overPrim") {
                    _this._overPrimChanged(e.oldValue, e.newValue);
                }
            });
            this._mouseOverUIElement = null;
        }
        Object.defineProperty(Window.prototype, "canvas", {
            get: function () {
                return this._canvas;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "left", {
            get: function () {
                return this._left;
            },
            set: function (value) {
                var old = new BABYLON.Vector2(this._left, this._bottom);
                this._left = value;
                this.onPropertyChanged("_position", old, this._position);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "bottom", {
            get: function () {
                return this._bottom;
            },
            set: function (value) {
                var old = new BABYLON.Vector2(this._left, this._bottom);
                this._bottom = value;
                this.onPropertyChanged("_position", old, this._position);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "position", {
            get: function () {
                return this._position;
            },
            set: function (value) {
                this._left = value.x;
                this._bottom = value.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "_position", {
            get: function () {
                return new BABYLON.Vector2(this.left, this.bottom);
            },
            enumerable: true,
            configurable: true
        });
        Window.prototype.createVisualTree = function () {
            _super.prototype.createVisualTree.call(this);
            var p = this._visualPlaceholder;
            p.createSimpleDataBinding(BABYLON.Group2D.positionProperty, "position");
        };
        Window.prototype._registerVisualToBuild = function (uiel) {
            if (uiel._isFlagSet(BABYLON.UIElement.flagVisualToBuild)) {
                return;
            }
            if (!this._UIElementVisualToBuildList) {
                this._UIElementVisualToBuildList = new Array();
            }
            this._UIElementVisualToBuildList.push(uiel);
            uiel._setFlags(BABYLON.UIElement.flagVisualToBuild);
        };
        Window.prototype._overPrimChanged = function (oldPrim, newPrim) {
            var curOverEl = this._mouseOverUIElement;
            var newOverEl = null;
            var curGroup = newPrim ? newPrim.traverseUp(function (p) { return p instanceof BABYLON.Group2D; }) : null;
            while (curGroup) {
                var uiel = curGroup.getExternalData("_GUIOwnerElement_");
                if (uiel) {
                    newOverEl = uiel;
                    break;
                }
                curGroup = curGroup.parent ? curGroup.parent.traverseUp(function (p) { return p instanceof BABYLON.Group2D; }) : null;
            }
            if (curOverEl === newOverEl) {
                return;
            }
            if (curOverEl) {
                curOverEl.isMouseOver = false;
            }
            if (newOverEl) {
                newOverEl.isMouseOver = true;
            }
            this._mouseOverUIElement = newOverEl;
        };
        Window.prototype._canvasPreRender = function () {
            // Check if we have visual to create
            if (this._UIElementVisualToBuildList.length > 0) {
                // Sort the UI Element to get the highest (so lowest hierarchy depth) in the hierarchy tree first
                var sortedElementList = this._UIElementVisualToBuildList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                for (var _i = 0, sortedElementList_1 = sortedElementList; _i < sortedElementList_1.length; _i++) {
                    var el = sortedElementList_1[_i];
                    el._createVisualTree();
                }
                this._UIElementVisualToBuildList.splice(0);
            }
        };
        Window.prototype._canvasDisposed = function () {
            this._canvas.disposeObservable.remove(this._disposeObserver);
            this._canvas.renderObservable.remove(this._renderObserver);
        };
        Window.getScreenCanvas = function (scene) {
            var canvas = BABYLON.Tools.first(Window._screenCanvasList, function (c) { return c.scene === scene; });
            if (canvas) {
                return canvas;
            }
            canvas = new BABYLON.ScreenSpaceCanvas2D(scene, { id: "GUI Canvas", cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_DONTCACHE });
            Window._screenCanvasList.push(canvas);
            return canvas;
        };
        Window.WINDOW_PROPCOUNT = BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 2;
        Window._screenCanvasList = new Array();
        __decorate([
            BABYLON.dependencyProperty(BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 0, function (pi) { return Window.leftProperty = pi; })
        ], Window.prototype, "left", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 1, function (pi) { return Window.bottomProperty = pi; })
        ], Window.prototype, "bottom", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 2, function (pi) { return Window.positionProperty = pi; })
        ], Window.prototype, "position", null);
        Window = __decorate([
            BABYLON.className("Window", "BABYLON")
        ], Window);
        return Window;
    }(BABYLON.ContentControl));
    BABYLON.Window = Window;
    var DefaultWindowRenderingTemplate = (function (_super) {
        __extends(DefaultWindowRenderingTemplate, _super);
        function DefaultWindowRenderingTemplate() {
            _super.apply(this, arguments);
        }
        DefaultWindowRenderingTemplate.prototype.createVisualTree = function (owner, visualPlaceholder) {
            var r = new BABYLON.Rectangle2D({ parent: visualPlaceholder, fill: "#808080FF" });
            return { root: r, contentPlaceholder: r };
        };
        DefaultWindowRenderingTemplate = __decorate([
            BABYLON.registerWindowRenderingTemplate("BABYLON.Window", "Default", function () { return new DefaultWindowRenderingTemplate(); })
        ], DefaultWindowRenderingTemplate);
        return DefaultWindowRenderingTemplate;
    }(BABYLON.UIElementRenderingTemplateBase));
    BABYLON.DefaultWindowRenderingTemplate = DefaultWindowRenderingTemplate;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Label = (function (_super) {
        __extends(Label, _super);
        function Label(settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            if (settings.text != null) {
                this.text = settings.text;
            }
        }
        Object.defineProperty(Label.prototype, "_position", {
            get: function () {
                return BABYLON.Vector2.Zero();
            },
            enumerable: true,
            configurable: true
        });
        Label.prototype._getChildren = function () {
            return Label._emptyArray;
        };
        Label.prototype.createVisualTree = function () {
            _super.prototype.createVisualTree.call(this);
            var p = this._visualChildrenPlaceholder;
        };
        Object.defineProperty(Label.prototype, "text", {
            get: function () {
                return this._text;
            },
            set: function (value) {
                this._text = value;
            },
            enumerable: true,
            configurable: true
        });
        Label._emptyArray = new Array();
        __decorate([
            BABYLON.dependencyProperty(BABYLON.Control.CONTROL_PROPCOUNT + 0, function (pi) { return Label.textProperty = pi; })
        ], Label.prototype, "text", null);
        Label = __decorate([
            BABYLON.className("Label", "BABYLON")
        ], Label);
        return Label;
    }(BABYLON.Control));
    BABYLON.Label = Label;
    var DefaultLabelRenderingTemplate = (function (_super) {
        __extends(DefaultLabelRenderingTemplate, _super);
        function DefaultLabelRenderingTemplate() {
            _super.apply(this, arguments);
        }
        DefaultLabelRenderingTemplate.prototype.createVisualTree = function (owner, visualPlaceholder) {
            var r = new BABYLON.Text2D("", { parent: visualPlaceholder });
            r.createSimpleDataBinding(BABYLON.Text2D.textProperty, "text");
            r.dataSource = owner;
            return { root: r, contentPlaceholder: r };
        };
        DefaultLabelRenderingTemplate = __decorate([
            BABYLON.registerWindowRenderingTemplate("BABYLON.Label", "Default", function () { return new DefaultLabelRenderingTemplate(); })
        ], DefaultLabelRenderingTemplate);
        return DefaultLabelRenderingTemplate;
    }(BABYLON.UIElementRenderingTemplateBase));
    BABYLON.DefaultLabelRenderingTemplate = DefaultLabelRenderingTemplate;
})(BABYLON || (BABYLON = {}));







var BABYLON;
(function (BABYLON) {
    var Button = (function (_super) {
        __extends(Button, _super);
        function Button(settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            // For a button the default contentAlignemnt is center/center
            if (settings.contentAlignment == null) {
                this.contentAlignment.horizontal = BABYLON.PrimitiveAlignment.AlignCenter;
                this.contentAlignment.vertical = BABYLON.PrimitiveAlignment.AlignCenter;
            }
            this.normalEnabledBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#337AB7FF");
            this.normalDisabledBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#7BA9D0FF");
            this.normalMouseOverBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#286090FF");
            this.normalPushedBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#1E496EFF");
            this.normalEnabledBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#2E6DA4FF");
            this.normalDisabledBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#77A0C4FF");
            this.normalMouseOverBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#204D74FF");
            this.normalPushedBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#2E5D9EFF");
            this.defaultEnabledBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
            this.defaultDisabledBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
            this.defaultMouseOverBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#E6E6E6FF");
            this.defaultPushedBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#D4D4D4FF");
            this.defaultEnabledBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#CCCCCCFF");
            this.defaultDisabledBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#DEDEDEFF");
            this.defaultMouseOverBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#ADADADFF");
            this.defaultPushedBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#6C8EC5FF");
        }
        Object.defineProperty(Button.prototype, "isPushed", {
            get: function () {
                return this._isPushed;
            },
            set: function (value) {
                this._isPushed = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "isDefault", {
            get: function () {
                return this._isDefault;
            },
            set: function (value) {
                this._isDefault = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "isOutline", {
            get: function () {
                return this._isOutline;
            },
            set: function (value) {
                this._isOutline = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "clickObservable", {
            get: function () {
                if (!this._clickObservable) {
                    this._clickObservable = new BABYLON.Observable();
                }
                return this._clickObservable;
            },
            enumerable: true,
            configurable: true
        });
        Button.prototype._raiseClick = function () {
            console.log("click");
        };
        Button.prototype.createVisualTree = function () {
            var _this = this;
            _super.prototype.createVisualTree.call(this);
            var p = this._visualPlaceholder;
            p.pointerEventObservable.add(function (e, s) {
                // We reject an event coming from the placeholder because it means it's on an empty spot, so it's not valid.
                if (e.relatedTarget === _this._visualPlaceholder) {
                    return;
                }
                if (s.mask === BABYLON.PrimitivePointerInfo.PointerUp) {
                    _this._raiseClick();
                    _this.isPushed = false;
                }
                else if (s.mask === BABYLON.PrimitivePointerInfo.PointerDown) {
                    _this.isPushed = true;
                }
            }, BABYLON.PrimitivePointerInfo.PointerUp | BABYLON.PrimitivePointerInfo.PointerDown);
        };
        Object.defineProperty(Button.prototype, "_position", {
            get: function () {
                return BABYLON.Vector2.Zero();
            },
            enumerable: true,
            configurable: true
        });
        Button.BUTTON_PROPCOUNT = BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 3;
        __decorate([
            BABYLON.dependencyProperty(BABYLON.ContentControl.CONTROL_PROPCOUNT + 0, function (pi) { return Button.isPushedProperty = pi; })
        ], Button.prototype, "isPushed", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.ContentControl.CONTROL_PROPCOUNT + 1, function (pi) { return Button.isDefaultProperty = pi; })
        ], Button.prototype, "isDefault", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.ContentControl.CONTROL_PROPCOUNT + 2, function (pi) { return Button.isOutlineProperty = pi; })
        ], Button.prototype, "isOutline", null);
        Button = __decorate([
            BABYLON.className("Button", "BABYLON")
        ], Button);
        return Button;
    }(BABYLON.ContentControl));
    BABYLON.Button = Button;
    var DefaultButtonRenderingTemplate = (function (_super) {
        __extends(DefaultButtonRenderingTemplate, _super);
        function DefaultButtonRenderingTemplate() {
            _super.apply(this, arguments);
        }
        DefaultButtonRenderingTemplate.prototype.createVisualTree = function (owner, visualPlaceholder) {
            this._rect = new BABYLON.Rectangle2D({ parent: visualPlaceholder, fill: "#FF8080FF", border: "#FF8080FF", roundRadius: 10, borderThickness: 2 });
            this.stateChange();
            return { root: this._rect, contentPlaceholder: this._rect };
        };
        DefaultButtonRenderingTemplate.prototype.attach = function (owner) {
            var _this = this;
            _super.prototype.attach.call(this, owner);
            this.owner.propertyChanged.add(function (e, s) { return _this.stateChange(); }, BABYLON.UIElement.isEnabledProperty.flagId |
                BABYLON.UIElement.isFocusedProperty.flagId |
                BABYLON.UIElement.isMouseOverProperty.flagId |
                Button.isDefaultProperty.flagId |
                Button.isOutlineProperty.flagId |
                Button.isPushedProperty.flagId);
        };
        DefaultButtonRenderingTemplate.prototype.stateChange = function () {
            var b = this.owner;
            var bg = b.isDefault ? b.defaultEnabledBackground : b.normalEnabledBackground;
            var bd = b.isDefault ? b.defaultEnabledBorder : b.normalEnabledBorder;
            if (b.isPushed) {
                if (b.isDefault) {
                    bg = b.defaultPushedBackground;
                    bd = b.defaultPushedBorder;
                }
                else {
                    bg = b.normalPushedBackground;
                    bd = b.normalPushedBorder;
                }
            }
            else if (b.isMouseOver) {
                console.log("MouseOver Style");
                if (b.isDefault) {
                    bg = b.defaultMouseOverBackground;
                    bd = b.defaultMouseOverBorder;
                }
                else {
                    bg = b.normalMouseOverBackground;
                    bd = b.normalMouseOverBorder;
                }
            }
            else if (!b.isEnabled) {
                if (b.isDefault) {
                    bg = b.defaultDisabledBackground;
                    bd = b.defaultDisabledBorder;
                }
                else {
                    bg = b.normalDisabledBackground;
                    bd = b.normalDisabledBorder;
                }
            }
            this._rect.fill = bg;
            this._rect.border = bd;
        };
        DefaultButtonRenderingTemplate = __decorate([
            BABYLON.registerWindowRenderingTemplate("BABYLON.Button", "Default", function () { return new DefaultButtonRenderingTemplate(); })
        ], DefaultButtonRenderingTemplate);
        return DefaultButtonRenderingTemplate;
    }(BABYLON.UIElementRenderingTemplateBase));
    BABYLON.DefaultButtonRenderingTemplate = DefaultButtonRenderingTemplate;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['ellipse2dPixelShader'] = "varying vec4 vColor;\nvoid main(void) {\ngl_FragColor=vColor;\n}";
BABYLON.Effect.ShadersStore['ellipse2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\nattribute float index;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\n#ifdef Border\natt float borderThickness;\n#endif\n#ifdef FillSolid\natt vec4 fillSolidColor;\n#endif\n#ifdef BorderSolid\natt vec4 borderSolidColor;\n#endif\n#ifdef FillGradient\natt vec4 fillGradientColor1;\natt vec4 fillGradientColor2;\natt vec4 fillGradientTY;\n#endif\n#ifdef BorderGradient\natt vec4 borderGradientColor1;\natt vec4 borderGradientColor2;\natt vec4 borderGradientTY;\n#endif\n\natt vec3 properties;\n#define TWOPI 6.28318530\n\nvarying vec2 vUV;\nvarying vec4 vColor;\nvoid main(void) {\nvec2 pos2;\n#ifdef Border\nfloat w=properties.x;\nfloat h=properties.y;\nfloat ms=properties.z;\nvec2 borderOffset=vec2(1.0,1.0);\nfloat segi=index;\nif (index<ms) {\nborderOffset=vec2(1.0-(borderThickness*2.0/w),1.0-(borderThickness*2.0/h));\n}\nelse {\nsegi-=ms;\n}\nfloat angle=TWOPI*segi/ms;\npos2.x=(cos(angle)/2.0)+0.5;\npos2.y=(sin(angle)/2.0)+0.5;\npos2.x=((pos2.x-0.5)*borderOffset.x)+0.5;\npos2.y=((pos2.y-0.5)*borderOffset.y)+0.5;\n#else\nif (index == 0.0) {\npos2=vec2(0.5,0.5);\n}\nelse {\nfloat ms=properties.z;\nfloat angle=TWOPI*(index-1.0)/ms;\npos2.x=(cos(angle)/2.0)+0.5;\npos2.y=(sin(angle)/2.0)+0.5;\n}\n#endif\n#ifdef FillSolid\nvColor=fillSolidColor;\n#endif\n#ifdef BorderSolid\nvColor=borderSolidColor;\n#endif\n#ifdef FillGradient\nfloat v=dot(vec4(pos2.xy,1,1),fillGradientTY);\nvColor=mix(fillGradientColor2,fillGradientColor1,v); \n#endif\n#ifdef BorderGradient\nfloat v=dot(vec4(pos2.xy,1,1),borderGradientTY);\nvColor=mix(borderGradientColor2,borderGradientColor1,v); \n#endif\nvColor.a*=opacity;\nvec4 pos;\npos.xy=pos2.xy*properties.xy;\npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n}";
BABYLON.Effect.ShadersStore['lines2dPixelShader'] = "varying vec4 vColor;\nvoid main(void) {\ngl_FragColor=vColor;\n}";
BABYLON.Effect.ShadersStore['lines2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\nattribute vec2 position;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\n#ifdef FillSolid\natt vec4 fillSolidColor;\n#endif\n#ifdef BorderSolid\natt vec4 borderSolidColor;\n#endif\n#ifdef FillGradient\natt vec2 boundingMin;\natt vec2 boundingMax;\natt vec4 fillGradientColor1;\natt vec4 fillGradientColor2;\natt vec4 fillGradientTY;\n#endif\n#ifdef BorderGradient\natt vec4 borderGradientColor1;\natt vec4 borderGradientColor2;\natt vec4 borderGradientTY;\n#endif\n#define TWOPI 6.28318530\n\nvarying vec2 vUV;\nvarying vec4 vColor;\nvoid main(void) {\n#ifdef FillSolid\nvColor=fillSolidColor;\n#endif\n#ifdef BorderSolid\nvColor=borderSolidColor;\n#endif\n#ifdef FillGradient\nfloat v=dot(vec4((position.xy-boundingMin)/(boundingMax-boundingMin),1,1),fillGradientTY);\nvColor=mix(fillGradientColor2,fillGradientColor1,v); \n#endif\n#ifdef BorderGradient\nfloat v=dot(vec4((position.xy-boundingMin)/(boundingMax-boundingMin),1,1),borderGradientTY);\nvColor=mix(borderGradientColor2,borderGradientColor1,v); \n#endif\nvColor.a*=opacity;\nvec4 pos;\npos.xy=position.xy;\npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n}";
BABYLON.Effect.ShadersStore['rect2dPixelShader'] = "varying vec4 vColor;\nvoid main(void) {\ngl_FragColor=vColor;\n}";
BABYLON.Effect.ShadersStore['rect2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\nattribute float index;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\n#ifdef Border\natt float borderThickness;\n#endif\n#ifdef FillSolid\natt vec4 fillSolidColor;\n#endif\n#ifdef BorderSolid\natt vec4 borderSolidColor;\n#endif\n#ifdef FillGradient\natt vec4 fillGradientColor1;\natt vec4 fillGradientColor2;\natt vec4 fillGradientTY;\n#endif\n#ifdef BorderGradient\natt vec4 borderGradientColor1;\natt vec4 borderGradientColor2;\natt vec4 borderGradientTY;\n#endif\n\natt vec3 properties;\n\n#define rsub0 17.0\n#define rsub1 33.0\n#define rsub2 49.0\n#define rsub3 65.0\n#define rsub 64.0\n#define TWOPI 6.28318530\n\nvarying vec2 vUV;\nvarying vec4 vColor;\nvoid main(void) {\nvec2 pos2;\n\nif (properties.z == 0.0) {\n#ifdef Border\nfloat w=properties.x;\nfloat h=properties.y;\nvec2 borderOffset=vec2(1.0,1.0);\nfloat segi=index;\nif (index<4.0) {\nborderOffset=vec2(1.0-(borderThickness*2.0/w),1.0-(borderThickness*2.0/h));\n}\nelse {\nsegi-=4.0;\n}\nif (segi == 0.0) {\npos2=vec2(1.0,1.0);\n} \nelse if (segi == 1.0) {\npos2=vec2(1.0,0.0);\n}\nelse if (segi == 2.0) {\npos2=vec2(0.0,0.0);\n} \nelse {\npos2=vec2(0.0,1.0);\n}\npos2.x=((pos2.x-0.5)*borderOffset.x)+0.5;\npos2.y=((pos2.y-0.5)*borderOffset.y)+0.5;\n#else\nif (index == 0.0) {\npos2=vec2(0.5,0.5);\n}\nelse if (index == 1.0) {\npos2=vec2(1.0,1.0);\n}\nelse if (index == 2.0) {\npos2=vec2(1.0,0.0);\n}\nelse if (index == 3.0) {\npos2=vec2(0.0,0.0);\n}\nelse {\npos2=vec2(0.0,1.0);\n}\n#endif\n}\nelse\n{\n#ifdef Border\nfloat w=properties.x;\nfloat h=properties.y;\nfloat r=properties.z;\nfloat nru=r/w;\nfloat nrv=r/h;\nvec2 borderOffset=vec2(1.0,1.0);\nfloat segi=index;\nif (index<rsub) {\nborderOffset=vec2(1.0-(borderThickness*2.0/w),1.0-(borderThickness*2.0/h));\n}\nelse {\nsegi-=rsub;\n}\n\nif (segi<rsub0) {\npos2=vec2(1.0-nru,nrv);\n}\n\nelse if (segi<rsub1) {\npos2=vec2(nru,nrv);\n}\n\nelse if (segi<rsub2) {\npos2=vec2(nru,1.0-nrv);\n}\n\nelse {\npos2=vec2(1.0-nru,1.0-nrv);\n}\nfloat angle=TWOPI-((index-1.0)*TWOPI/(rsub-0.5));\npos2.x+=cos(angle)*nru;\npos2.y+=sin(angle)*nrv;\npos2.x=((pos2.x-0.5)*borderOffset.x)+0.5;\npos2.y=((pos2.y-0.5)*borderOffset.y)+0.5;\n#else\nif (index == 0.0) {\npos2=vec2(0.5,0.5);\n}\nelse {\nfloat w=properties.x;\nfloat h=properties.y;\nfloat r=properties.z;\nfloat nru=r/w;\nfloat nrv=r/h;\n\nif (index<rsub0) {\npos2=vec2(1.0-nru,nrv);\n}\n\nelse if (index<rsub1) {\npos2=vec2(nru,nrv);\n}\n\nelse if (index<rsub2) {\npos2=vec2(nru,1.0-nrv);\n}\n\nelse {\npos2=vec2(1.0-nru,1.0-nrv);\n}\nfloat angle=TWOPI-((index-1.0)*TWOPI/(rsub-0.5));\npos2.x+=cos(angle)*nru;\npos2.y+=sin(angle)*nrv;\n}\n#endif\n}\n#ifdef FillSolid\nvColor=fillSolidColor;\n#endif\n#ifdef BorderSolid\nvColor=borderSolidColor;\n#endif\n#ifdef FillGradient\nfloat v=dot(vec4(pos2.xy,1,1),fillGradientTY);\nvColor=mix(fillGradientColor2,fillGradientColor1,v); \n#endif\n#ifdef BorderGradient\nfloat v=dot(vec4(pos2.xy,1,1),borderGradientTY);\nvColor=mix(borderGradientColor2,borderGradientColor1,v); \n#endif\nvColor.a*=opacity;\nvec4 pos;\npos.xy=pos2.xy*properties.xy;\npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n}";
BABYLON.Effect.ShadersStore['sprite2dPixelShader'] = "varying vec2 vUV;\nvarying float vOpacity;\nuniform bool alphaTest;\nuniform sampler2D diffuseSampler;\nvoid main(void) {\nvec4 color=texture2D(diffuseSampler,vUV);\nif (alphaTest)\n{\nif (color.a<0.95) {\ndiscard;\n}\n}\ncolor.a*=vOpacity;\ngl_FragColor=color;\n}";
BABYLON.Effect.ShadersStore['sprite2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\n\nattribute float index;\natt vec2 topLeftUV;\natt vec2 sizeUV;\natt vec2 scaleFactor;\natt vec2 textureSize;\n\natt vec3 properties;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\n\n\nvarying vec2 vUV;\nvarying float vOpacity;\nvoid main(void) {\nvec2 pos2;\n\nvec2 off=vec2(0.0,0.0);\nvec2 sfSizeUV=sizeUV*scaleFactor;\nfloat frame=properties.x;\nfloat invertY=properties.y;\nfloat alignToPixel=properties.z;\n\nif (index == 0.0) {\npos2=vec2(0.0,0.0);\nvUV=vec2(topLeftUV.x+(frame*sfSizeUV.x)+off.x,topLeftUV.y-off.y);\n}\n\nelse if (index == 1.0) {\npos2=vec2(0.0,1.0);\nvUV=vec2(topLeftUV.x+(frame*sfSizeUV.x)+off.x,(topLeftUV.y+sfSizeUV.y));\n}\n\nelse if (index == 2.0) {\npos2=vec2( 1.0,1.0);\nvUV=vec2(topLeftUV.x+sfSizeUV.x+(frame*sfSizeUV.x),(topLeftUV.y+sfSizeUV.y));\n}\n\nelse if (index == 3.0) {\npos2=vec2( 1.0,0.0);\nvUV=vec2(topLeftUV.x+sfSizeUV.x+(frame*sfSizeUV.x),topLeftUV.y-off.y);\n}\nif (invertY == 1.0) {\nvUV.y=1.0-vUV.y;\n}\nvec4 pos;\nif (alignToPixel == 1.0)\n{\npos.xy=floor(pos2.xy*sizeUV*textureSize);\n} else {\npos.xy=pos2.xy*sizeUV*textureSize;\n}\nvOpacity=opacity;\npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n} ";
BABYLON.Effect.ShadersStore['text2dPixelShader'] = "varying vec4 vColor;\nvarying vec2 vUV;\n\nuniform sampler2D diffuseSampler;\nvoid main(void) {\nvec4 color=texture2D(diffuseSampler,vUV);\ngl_FragColor=color*vColor;\n}";
BABYLON.Effect.ShadersStore['text2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\n\nattribute float index;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\natt vec2 topLeftUV;\natt vec2 sizeUV;\natt vec2 textureSize;\natt vec4 color;\natt float superSampleFactor;\n\nvarying vec2 vUV;\nvarying vec4 vColor;\nvoid main(void) {\nvec2 pos2;\n\nif (index == 0.0) {\npos2=vec2(0.0,0.0);\nvUV=vec2(topLeftUV.x,topLeftUV.y+sizeUV.y);\n}\n\nelse if (index == 1.0) {\npos2=vec2(0.0,1.0);\nvUV=vec2(topLeftUV.x,topLeftUV.y);\n}\n\nelse if (index == 2.0) {\npos2=vec2(1.0,1.0);\nvUV=vec2(topLeftUV.x+sizeUV.x,topLeftUV.y);\n}\n\nelse if (index == 3.0) {\npos2=vec2(1.0,0.0);\nvUV=vec2(topLeftUV.x+sizeUV.x,topLeftUV.y+sizeUV.y);\n}\n\nvUV=(floor(vUV*textureSize)+vec2(0.0,0.0))/textureSize;\nvColor=color;\nvColor.a*=opacity;\nvec4 pos;\npos.xy=floor(pos2.xy*superSampleFactor*sizeUV*textureSize); \npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n}";

if (((typeof window != "undefined" && window.module) || (typeof module != "undefined")) && typeof module.exports != "undefined") {
    module.exports = BABYLON;
};
