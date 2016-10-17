module BABYLON {

    /**
     * Class for the ObservableArray.onArrayChanged observable
     */
    export class ArrayChanged<T> {
        constructor() {
            this.action = 0;
            this.newItems = new Array<{index: number, value: T }>();
            this.removedItems = new Array<{ index: number, value: T }>();
            this.changedItems = new Array<{ index: number, value: T }>();
            this.newStartingIndex = -1;
            this.removedStartingIndex = -1;
        }

        /**
         * Contain the action that were made on the ObservableArray, it's one of the ArrayChanged.xxxAction members.
         * Note the action's value can be used in the "mask" field of the Observable to only be notified about given action(s)
         */
        public action: number;

        /**
         * Only valid if the action is newItemsAction
         */
        public newItems: { index: number, value: T }[];

        /**
         * Only valid if the action is removedItemsAction
         */
        public removedItems: { index: number, value: T }[];

        /**
         * Only valid if the action is changedItemAction
         */
        public changedItems: { index: number, value: T }[];

        /**
         * Get the index of the first item inserted
         */
        public newStartingIndex: number;

        /**
         * Get the index of the first item removed
         */
        public removedStartingIndex: number;

        /**
         * Get the index of the first changed item
         */
        public changedStartingIndex: number;

        /**
         * The content of the array was totally cleared
         */
        public static get clearAction() {
            return ArrayChanged._clearAction;
        }

        /**
         * A new item was added, the newItems field contains the key/value pairs
         */
        public static get newItemsAction() {
            return ArrayChanged._newItemsAction;
        }

        /**
         * An existing item was removed, the removedKey field contains its key
         */
        public static get removedItemsAction() {
            return ArrayChanged._removedItemsAction;
        }

        /**
         * One or many items in the array were changed, the 
         */
        public static get changedItemAction() {
            return ArrayChanged._changedItemAction;
        }

        /**
         * The array's content was totally changed
         * Depending on the method that used this mode the ChangedArray object may contains more information
         */
        public static get replacedArrayAction() {
            return ArrayChanged._replacedArrayAction;
        }

        /**
         * The length of the array changed
         */
        public static get lengthChangedAction() {
            return ArrayChanged._lengthChangedAction;
        }

        private static _clearAction            = 0x1;
        private static _newItemsAction         = 0x2;
        private static _removedItemsAction     = 0x4;
        private static _replacedArrayAction    = 0x8;
        private static _lengthChangedAction    = 0x10;
        private static _changedItemAction      = 0x20;

        clear() {
            this.action = 0;
            this.newItems.splice(0);
            this.removedItems.splice(0);
            this.changedItems.splice(0);
            this.removedStartingIndex = this.removedStartingIndex = this.changedStartingIndex = 0;
        }
    }

    export class OAWatchedObjectChangedInfo<T> {
        object: T;
        propertyChanged: PropertyChangedInfo;
    }

    /**
     * This class mimics the Javascript Array and TypeScript Array<T> classes, adding new features concerning the Observable pattern.
     * 
     */
    export class ObservableArray<T> extends PropertyChangedBase {
        /**
         * Create an Observable Array.
         * @param watchObjectsPropertyChange
         * @param array and optional array that will be encapsulated by this ObservableArray instance. That's right, it's NOT a copy!
         */
        constructor(watchObjectsPropertyChange: boolean, array?: Array<T>) {
            super();
            this._array = (array!=null) ? array : new Array<T>();
            this.dci = new ArrayChanged<T>();
            this._callingArrayChanged = false;
            this._arrayChanged = null;

            this._callingWatchedObjectChanged = false;
            this._watchObjectsPropertyChange = watchObjectsPropertyChange;
            this._watchedObjectList = this._watchObjectsPropertyChange ? new StringDictionary<Observer<PropertyChangedInfo>>() : null;
            this._woci = new OAWatchedObjectChangedInfo<T>();
        }

        /**
          * Gets or sets the length of the array. This is a number one higher than the highest element defined in an array.
          */
        get length(): number {
            return this._array.length;
        }

        set length(value: number) {
            if (value === this._array.length) {
                return;
            }

            let oldLength = this._array.length;
            this._array.length = value;

            this.onPropertyChanged("length", oldLength, this._array.length);
        }

        getAt(index: number): T {
            return this._array[index];
        }

        setAt(index: number, value: T): boolean {
            if (index < 0) {
                return false;
            }

            let insertion = (index >= this._array.length) || this._array[index] === undefined;
            let oldLength = 0;
            if (insertion) {
                oldLength = this._array.length;
            } else if (this._watchObjectsPropertyChange) {
                this._removeWatchedElement(this._array[index]);
            }

            this._array[index] = value;

            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement(value);
            }

            if (insertion) {
                this.onPropertyChanged("length", oldLength, this._array.length);
            }

            let ac = this.getArrayChangedObject();
            if (ac) {
                ac.action = insertion ? ArrayChanged.newItemsAction : ArrayChanged.changedItemAction;
                if (insertion) {
                    ac.newItems.splice(0, ac.newItems.length, { index: index, value: value });
                    ac.newStartingIndex = index;
                    ac.changedItems.splice(0);
                } else {
                    ac.newItems.splice(0);
                    ac.changedStartingIndex = index;
                    ac.changedItems.splice(0, ac.changedItems.length, { index: index, value: value });
                }
                ac.removedItems.splice(0);
                ac.removedStartingIndex = -1;
                this.callArrayChanged(ac);
            }
        }

        /**
          * Returns a string representation of an array.
          */
        toString(): string {
            return this._array.toString();
        }

        toLocaleString(): string {
            return this._array.toLocaleString();
        }

        /**
          * Appends new elements to an array, and returns the new length of the array.
          * @param items New elements of the Array.
          */
        push(...items: T[]): number {
            let oldLength = this._array.length;
            let n = this._array.push(...items);

            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement(...items);
            }

            this.onPropertyChanged("length", oldLength, this._array.length);
            let ac = this.getArrayChangedObject();
            if (ac) {
                ac.action = ArrayChanged.newItemsAction;
                ac.newStartingIndex = oldLength;
                this.feedNotifArray(ac.newItems, oldLength, ...items);
                this.callArrayChanged(ac);
            }

            return n;
        }

        /**
          * Removes the last element from an array and returns it.
          */
        pop(): T {
            let firstRemove = this._array.length - 1;
            let res = this._array.pop();

            if (res && this._watchObjectsPropertyChange) {
                this._removeWatchedElement(res);
            }

            if (firstRemove !== -1) {
                this.onPropertyChanged("length", this._array.length + 1, this._array.length);

                let ac = this.getArrayChangedObject();
                if (ac) {
                    ac.action = ArrayChanged.removedItemsAction;
                    ac.removedStartingIndex = firstRemove;
                    this.feedNotifArray(ac.removedItems, firstRemove, res);
                }
            }

            return res;
        }

        /**
          * Combines two or more arrays.
          * @param items Additional items to add to the end of array1.
          */
        concat(...items: T[]): ObservableArray<T> {
            return new ObservableArray<T>(this._watchObjectsPropertyChange, this._array.concat(...items));
        }

        /**
          * Adds all the elements of an array separated by the specified separator string.
          * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
          */
        join(separator?: string): string {
            return this._array.join(separator);
        }

        /**
          * Reverses the elements in an Array.
         * The arrayChanged action is 
          */
        reverse(): T[] {
            let res = this._array.reverse();

            let ac = this.getArrayChangedObject();
            ac.action = ArrayChanged.replacedArrayAction;

            return res;
        }

        /**
          * Removes the first element from an array and returns it, shift all subsequents element one element before.
         * The ArrayChange action is replacedArrayAction, the whole array changes and must be reevaluate as such, the removed element is in removedItems.
         * 
          */
        shift(): T {
            let oldLength = this._array.length;
            let res = this._array.shift();

            if (this._watchedObjectChanged && res!=null) {
                this._removeWatchedElement(res);
            }

            if (oldLength !== 0) {
                this.onPropertyChanged("length", oldLength, this._array.length);

                let ac = this.getArrayChangedObject();
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
        }

        /** 
          * Returns a section of an array.
          * @param start The beginning of the specified portion of the array.
          * @param end The end of the specified portion of the array.
          */
        slice(start?: number, end?: number): ObservableArray<T> {
            return new ObservableArray<T>(this._watchObjectsPropertyChange, this._array.slice(start, end));
        }

        /**
          * Sorts an array.
          * @param compareFn The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
         * On the contrary of the Javascript Array's implementation, this method returns nothing
          */
        sort(compareFn?: (a: T, b: T) => number): void {
            let oldLength = this._array.length;

            this._array.sort(compareFn);

            if (oldLength !== 0) {
                let ac = this.getArrayChangedObject();
                if (ac) {
                    ac.clear();
                    ac.action = ArrayChanged.replacedArrayAction;
                    this.callArrayChanged(ac);
                }
            }
        }

        /**
          * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
          * @param start The zero-based location in the array from which to start removing elements.
          * @param deleteCount The number of elements to remove.
          * @param items Elements to insert into the array in place of the deleted elements.
          */
        splice(start: number, deleteCount: number, ...items: T[]): T[] {
            let oldLength = this._array.length;

            if (this._watchObjectsPropertyChange) {
                for (let i = start; i < start+deleteCount; i++) {
                    let val = this._array[i];
                    if (this._watchObjectsPropertyChange && val != null) {
                        this._removeWatchedElement(val);
                    }
                }
            }

            let res = this._array.splice(start, deleteCount, ...items);

            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement(...items);
            }

            if (oldLength !== this._array.length) {
                this.onPropertyChanged("length", oldLength, this._array.length);
            }

            let ac = this.getArrayChangedObject();
            if (ac) {
                ac.clear();
                ac.action = ArrayChanged.replacedArrayAction;
                this.callArrayChanged(ac);
            }

            return res;
        }

        /**
          * Inserts new elements at the start of an array.
          * @param items  Elements to insert at the start of the Array.
          * The ChangedArray action is replacedArrayAction, newItems contains the list of the added items
          */
        unshift(...items: T[]): number {
            let oldLength = this._array.length;
            
            let res = this._array.unshift(...items);

            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement(...items);
            }

            this.onPropertyChanged("length", oldLength, this._array.length);
            let ac = this.getArrayChangedObject();
            if (ac) {
                ac.clear();
                ac.action = ArrayChanged.replacedArrayAction;
                ac.newStartingIndex = 0,
                this.feedNotifArray(ac.newItems, 0, ...items);
                this.callArrayChanged(ac);
            }

            return res;
        }

        /**
          * Returns the index of the first occurrence of a value in an array.
          * @param searchElement The value to locate in the array.
          * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
          */
        indexOf(searchElement: T, fromIndex?: number): number {
            return this._array.indexOf(searchElement, fromIndex);
        }

        /**
          * Returns the index of the last occurrence of a specified value in an array.
          * @param searchElement The value to locate in the array.
          * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
          */
        lastIndexOf(searchElement: T, fromIndex?: number): number {
            return this._array.lastIndexOf(searchElement, fromIndex);
        }

        /**
          * Determines whether all the members of an array satisfy the specified test.
          * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        every(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean {
            return this._array.every(callbackfn, thisArg);
        }

        /**
          * Determines whether the specified callback function returns true for any element of an array.
          * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        some(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean {
            return this._array.some(callbackfn, thisArg);
        }

        /**
          * Performs the specified action for each element in an array.
          * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array. 
          * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void {
            return this._array.forEach(callbackfn, thisArg);
        }

        /**
          * Calls a defined callback function on each element of an array, and returns an array that contains the results.
          * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array. 
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
            return this._array.map(callbackfn, thisArg);
        }

        /**
          * Returns the elements of an array that meet the condition specified in a callback function. 
          * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array. 
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[] {
            return this._array.filter(callbackfn, thisArg);
        }

        /**
          * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
          * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
          * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
          */
        reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T): T {
            return this._array.reduce(callbackfn);
        }

        /** 
          * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
          * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array. 
          * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
          */
        reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T): T {
            return this._array.reduceRight(callbackfn);
        }

        get arrayChanged(): Observable<ArrayChanged<T>> {
            if (!this._arrayChanged) {
                this._arrayChanged = new Observable<ArrayChanged<T>>();
            }
            return this._arrayChanged;
        }

        protected getArrayChangedObject(): ArrayChanged<T> {
            if (this._arrayChanged && this._arrayChanged.hasObservers()) {
                let ac = this._callingArrayChanged ? new ArrayChanged<T>() : this.dci;
                return ac;
            }
            return null;
        }

        protected feedNotifArray(array: { index: number, value: T }[], startindIndex: number, ...items: T[]) {
            array.splice(0);
            for (let i = 0; i < items.length; i++) {
                let value = this._array[i + startindIndex];
                if (value !== undefined) {
                    array.push({ index: i + startindIndex, value: value });
                }
            }
        }

        protected callArrayChanged(ac: ArrayChanged<T>) {
            try {
                this._callingArrayChanged = true;
                this.arrayChanged.notifyObservers(ac, ac.action);
            } finally {
                this._callingArrayChanged = false;
            }
        }

        get watchedObjectChanged(): Observable<OAWatchedObjectChangedInfo<T>> {
            if (!this._watchedObjectChanged) {
                this._watchedObjectChanged = new Observable<OAWatchedObjectChangedInfo<T>>();
            }
            return this._watchedObjectChanged;
        }

        private _addWatchedElement(...items: T[]) {
            for (let curItem of items) {
                if (curItem["propertyChanged"]) {
                    let key = curItem["__ObsArrayObjID__"] as string;

                    // The object may already be part of another ObsArray, so there already be a valid ID
                    if (!key) {
                        key = Tools.RandomId();
                        curItem["__ObsArrayObjID__"] = key;
                    }

                    this._watchedObjectList.add(key, (<IPropertyChanged><any>curItem).propertyChanged.add((e, d) => {
                        this.onWatchedObjectChanged(key, curItem, e);
                    }));
                }
            }
        }

        private _removeWatchedElement(...items: T[]) {
            for (let curItem of items) {
                let key = curItem["__ObsArrayObjID__"] as string;
                if (key != null) {
                    let observer = this._watchedObjectList.getAndRemove(key);
                    (<IPropertyChanged><any>curItem).propertyChanged.remove(observer);
                }
            }
        }

        protected onWatchedObjectChanged(key: string, object: T, propChanged: PropertyChangedInfo) {
            if (this._watchedObjectChanged && this._watchedObjectChanged.hasObservers()) {

                let woci = this._callingWatchedObjectChanged ? new OAWatchedObjectChangedInfo<T>() : this._woci;
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

        private _array: Array<T>;

        private _arrayChanged: Observable<ArrayChanged<T>>;
        private dci = new ArrayChanged<T>();
        private _callingArrayChanged: boolean = false;

        private _watchedObjectChanged: Observable<OAWatchedObjectChangedInfo<T>>;
        private _woci: OAWatchedObjectChangedInfo<T>;
        private _callingWatchedObjectChanged: boolean;
        private _watchObjectsPropertyChange: boolean;
        private _watchedObjectList: StringDictionary<Observer<PropertyChangedInfo>>;

    }
}