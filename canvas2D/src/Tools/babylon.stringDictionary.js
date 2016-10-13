var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
