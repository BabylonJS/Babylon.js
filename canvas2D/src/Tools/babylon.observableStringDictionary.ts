module BABYLON {

    /**
     * Class for the ObservableStringDictionary.onDictionaryChanged observable
     */
    export class DictionaryChanged<T> {
        /**
         * Contain the action that were made on the dictionary, it's one of the DictionaryChanged.xxxAction members.
         * Note the action's value can be used in the "mask" field of the Observable to only be notified about given action(s)
         */
        public action: number;

        /**
         * Only valid if the action is newItemAction
         */
        public newItem: { key: string, value: T }

        /**
         * Only valid if the action is removedItemAction
         */
        public removedKey: string;

        /**
         * Only valid if the action is itemValueChangedAction
         */
        public changedItem: { key: string, oldValue: T, newValue: T }

        /**
         * The content of the dictionary was totally cleared
         */
        public static get clearAction() {
            return DictionaryChanged._clearAction;
        }

        /**
         * A new item was added, the newItem field contains the key/value pair
         */
        public static get newItemAction() {
            return DictionaryChanged._newItemAction;
        }

        /**
         * An existing item was removed, the removedKey field contains its key
         */
        public static get removedItemAction() {
            return DictionaryChanged._removedItemAction;
        }

        /**
         * An existing item had a value change, the changedItem field contains the key/value
         */
        public static get itemValueChangedAction() {
            return DictionaryChanged._itemValueChangedAction;
        }

        /**
         * The dictionary's content was reset and replaced by the content of another dictionary.
         * DictionaryChanged<T> contains no further information about this action
         */
        public static get replacedAction() {
            return DictionaryChanged._replacedAction;
        }

        private static _clearAction            = 0x1;
        private static _newItemAction          = 0x2;
        private static _removedItemAction      = 0x4;
        private static _itemValueChangedAction = 0x8;
        private static _replacedAction         = 0x10;
    }

    export class OSDWatchedObjectChangedInfo<T> {
        key: string;
        object: T;
        propertyChanged: PropertyChangedInfo;
    }

    export class ObservableStringDictionary<T> extends StringDictionary<T> implements IPropertyChanged {

        constructor(watchObjectsPropertyChange: boolean) {
            super();

            this._propertyChanged = null;
            this._dictionaryChanged = null;
            this.dci = new DictionaryChanged<T>();
            this._callingDicChanged = false;
            this._watchedObjectChanged = null;
            this._callingWatchedObjectChanged = false;
            this._woci = new OSDWatchedObjectChangedInfo<T>();
            this._watchObjectsPropertyChange = watchObjectsPropertyChange;
            this._watchedObjectList = this._watchObjectsPropertyChange ? new StringDictionary<Observer<PropertyChangedInfo>>() : null;
        }

        /**
         * This will clear this dictionary and copy the content from the 'source' one.
         * If the T value is a custom object, it won't be copied/cloned, the same object will be used
         * @param source the dictionary to take the content from and copy to this dictionary
         */
        public copyFrom(source: StringDictionary<T>) {
            let oldCount = this.count;
            // Don't rely on this class' implementation for clear/add otherwise tons of notification will be thrown
            super.clear();
            source.forEach((t, v) => this._add(t, v, false, this._watchObjectsPropertyChange));
            this.onDictionaryChanged(DictionaryChanged.replacedAction, null, null, null);
            this.onPropertyChanged("count", oldCount, this.count);
        }

        /**
         * Get a value from its key or add it if it doesn't exist.
         * This method will ensure you that a given key/data will be present in the dictionary.
         * @param key the given key to get the matching value from
         * @param factory the factory that will create the value if the key is not present in the dictionary.
         * The factory will only be invoked if there's no data for the given key.
         * @return the value corresponding to the key.
         */
        public getOrAddWithFactory(key: string, factory: (key: string) => T): T {
            let val = super.getOrAddWithFactory(key, k => {
                let v = factory(key);
                this._add(key, v, true, this._watchObjectsPropertyChange);
                return v;
            });

            return val;
        }

        /**
         * Add a new key and its corresponding value
         * @param key the key to add
         * @param value the value corresponding to the key
         * @return true if the operation completed successfully, false if we couldn't insert the key/value because there was already this key in the dictionary
         */
        public add(key: string, value: T): boolean {
            return this._add(key, value, true, true);
        }

        public getAndRemove(key: string): T {
            let val = super.get(key);
            this._remove(key, true, val);
            return val;
        }

        private _add(key: string, value: T, fireNotif: boolean, registerWatcher: boolean): boolean {
            if (super.add(key, value)) {
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
        }

        private _addWatchedElement(key: string, el: T) {
            if (el["propertyChanged"]) {
                this._watchedObjectList.add(key, (<IPropertyChanged><any>el).propertyChanged.add((e, d) => {
                    this.onWatchedObjectChanged(key, el, e);
                }));
            }            
        }

        private _removeWatchedElement(key: string, el: T) {
            let observer = this._watchedObjectList.getAndRemove(key);
            if (el["propertyChanged"]) {
                (<IPropertyChanged><any>el).propertyChanged.remove(observer);
            }
        }

        public set(key: string, value: T): boolean {
            let oldValue = this.get(key);
            if (this._watchObjectsPropertyChange) {
                this._removeWatchedElement(key, oldValue);
            }

            if (super.set(key, value)) {
                this.onDictionaryChanged(DictionaryChanged.itemValueChangedAction, null, null, { key: key, oldValue: oldValue, newValue: value });
                this._addWatchedElement(key, value);
                return true;
            }

            return false;
        }

        /**
         * Remove a key/value from the dictionary.
         * @param key the key to remove
         * @return true if the item was successfully deleted, false if no item with such key exist in the dictionary
         */
        public remove(key: string): boolean {
            return this._remove(key, true);
        }

        private _remove(key: string, fireNotif: boolean, element?: T): boolean {
            if (!element) {
                element = this.get(key);
            }

            if (!element) {
                return false;
            }

            if (super.remove(key) === undefined) {
                return false;
            }

            this.onDictionaryChanged(DictionaryChanged.removedItemAction, null, key, null);
            this.onPropertyChanged("count", this.count + 1, this.count);

            if (this._watchObjectsPropertyChange) {
                this._removeWatchedElement(key, element);
            }

            return true;
        }

        /**
         * Clear the whole content of the dictionary
         */
        public clear() {
            this._watchedObjectList.forEach((k, v) => {
                let el = this.get(k);
                this._removeWatchedElement(k, el);
            });
            this._watchedObjectList.clear();

            let oldCount = this.count;
            super.clear();
            this.onDictionaryChanged(DictionaryChanged.clearAction, null, null, null);
            this.onPropertyChanged("count", oldCount, 0);
        }

        get propertyChanged(): Observable<PropertyChangedInfo> {
            if (!this._propertyChanged) {
                this._propertyChanged = new Observable<PropertyChangedInfo>();
            }
            return this._propertyChanged;
        }

        protected onPropertyChanged<T>(propName: string, oldValue: T, newValue: T, mask?: number) {
            if (this._propertyChanged && this._propertyChanged.hasObservers()) {

                let pci = ObservableStringDictionary.callingPropChanged ? new PropertyChangedInfo() : ObservableStringDictionary.pci;

                pci.oldValue = oldValue;
                pci.newValue = newValue;
                pci.propertyName = propName;

                try {
                    ObservableStringDictionary.callingPropChanged = true;
                    this.propertyChanged.notifyObservers(pci, mask);
                } finally {
                    ObservableStringDictionary.callingPropChanged = false;
                }
            }
        }

        get dictionaryChanged(): Observable<DictionaryChanged<T>> {
            if (!this._dictionaryChanged) {
                this._dictionaryChanged = new Observable<DictionaryChanged<T>>();
            }
            return this._dictionaryChanged;
        }

        protected onDictionaryChanged(action: number, newItem: { key: string, value: T }, removedKey: string, changedItem: { key: string, oldValue: T, newValue: T }) {
            if (this._dictionaryChanged && this._dictionaryChanged.hasObservers()) {

                let dci = this._callingDicChanged ? new DictionaryChanged<T>() : this.dci;

                dci.action = action;
                dci.newItem = newItem;
                dci.removedKey = removedKey;
                dci.changedItem = changedItem;

                try {
                    this._callingDicChanged = true;
                    this.dictionaryChanged.notifyObservers(dci, action);
                } finally {
                    this._callingDicChanged = false;
                }
            }
        }

        get watchedObjectChanged(): Observable<OSDWatchedObjectChangedInfo<T>> {
            if (!this._watchedObjectChanged) {
                this._watchedObjectChanged = new Observable<OSDWatchedObjectChangedInfo<T>>();
            }
            return this._watchedObjectChanged;
        }

        protected onWatchedObjectChanged(key: string, object: T, propChanged: PropertyChangedInfo) {
            if (this._watchedObjectChanged && this._watchedObjectChanged.hasObservers()) {

                let woci = this._callingWatchedObjectChanged ? new OSDWatchedObjectChangedInfo<T>() : this._woci;
                woci.key = key;
                woci.object = object;
                woci.propertyChanged = propChanged;

                try {
                    this._callingWatchedObjectChanged = true;
                    this.watchedObjectChanged.notifyObservers(woci);
                } finally {
                    this._callingWatchedObjectChanged = false;
                }
            }
        }

        private _propertyChanged: Observable<PropertyChangedInfo>;
        private static pci = new PropertyChangedInfo();
        private static callingPropChanged: boolean = false;

        private _dictionaryChanged: Observable<DictionaryChanged<T>>;
        private dci: DictionaryChanged<T>;
        private _callingDicChanged: boolean;

        private _watchedObjectChanged: Observable<OSDWatchedObjectChangedInfo<T>>;
        private _woci: OSDWatchedObjectChangedInfo<T>;
        private _callingWatchedObjectChanged: boolean;
        private _watchObjectsPropertyChange: boolean;
        private _watchedObjectList: StringDictionary<Observer<PropertyChangedInfo>>;
    }
}