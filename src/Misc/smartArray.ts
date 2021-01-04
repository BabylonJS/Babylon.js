/**
 * Defines an array and its length.
 * It can be helpful to group result from both Arrays and smart arrays in one structure.
 */
export interface ISmartArrayLike<T> {
    /**
     * The data of the array.
     */
    data: Array<T>;
    /**
     * The active length of the array.
     */
    length: number;
}

/**
 * Defines an GC Friendly array where the backfield array do not shrink to prevent over allocations.
 */
export class SmartArray<T> implements ISmartArrayLike<T> {
    /**
     * The full set of data from the array.
     */
    public data: Array<T>;

    /**
     * The active length of the array.
     */
    public length: number = 0;

    protected _id: number;

    /**
     * Instantiates a Smart Array.
     * @param capacity defines the default capacity of the array.
     */
    constructor(capacity: number) {
        this.data = new Array(capacity);
        this._id = SmartArray._GlobalId++;
    }

    /**
     * Pushes a value at the end of the active data.
     * @param value defines the object to push in the array.
     */
    public push(value: T): void {
        this.data[this.length++] = value;

        if (this.length > this.data.length) {
            this.data.length *= 2;
        }
    }

    /**
     * Iterates over the active data and apply the lambda to them.
     * @param func defines the action to apply on each value.
     */
    public forEach(func: (content: T) => void): void {
        for (var index = 0; index < this.length; index++) {
            func(this.data[index]);
        }
    }

    /**
     * Sorts the full sets of data.
     * @param compareFn defines the comparison function to apply.
     */
    public sort(compareFn: (a: T, b: T) => number): void {
        this.data.sort(compareFn);
    }

    /**
     * Resets the active data to an empty array.
     */
    public reset(): void {
        this.length = 0;
    }

    /**
     * Releases all the data from the array as well as the array.
     */
    public dispose(): void {
        this.reset();

        if (this.data) {
            this.data.length = 0;
            this.data = [];
        }
    }

    /**
     * Concats the active data with a given array.
     * @param array defines the data to concatenate with.
     */
    public concat(array: any): void {
        if (array.length === 0) {
            return;
        }
        if (this.length + array.length > this.data.length) {
            this.data.length = (this.length + array.length) * 2;
        }

        for (var index = 0; index < array.length; index++) {
            this.data[this.length++] = (array.data || array)[index];
        }
    }

    /**
     * Returns the position of a value in the active data.
     * @param value defines the value to find the index for
     * @returns the index if found in the active data otherwise -1
     */
    public indexOf(value: T): number {
        var position = this.data.indexOf(value);

        if (position >= this.length) {
            return -1;
        }

        return position;
    }

    /**
     * Returns whether an element is part of the active data.
     * @param value defines the value to look for
     * @returns true if found in the active data otherwise false
     */
    public contains(value: T): boolean {
        return this.indexOf(value) !== -1;
    }

    // Statics
    private static _GlobalId = 0;
}

/**
 * Defines an GC Friendly array where the backfield array do not shrink to prevent over allocations.
 * The data in this array can only be present once
 */
export class SmartArrayNoDuplicate<T> extends SmartArray<T> {
    private _duplicateId = 0;

    /**
     * Pushes a value at the end of the active data.
     * THIS DOES NOT PREVENT DUPPLICATE DATA
     * @param value defines the object to push in the array.
     */
    public push(value: T): void {
        super.push(value);

        if (!(<any>value).__smartArrayFlags) {
            (<any>value).__smartArrayFlags = {};
        }

        (<any>value).__smartArrayFlags[this._id] = this._duplicateId;
    }

    /**
     * Pushes a value at the end of the active data.
     * If the data is already present, it won t be added again
     * @param value defines the object to push in the array.
     * @returns true if added false if it was already present
     */
    public pushNoDuplicate(value: T): boolean {
        if ((<any>value).__smartArrayFlags && (<any>value).__smartArrayFlags[this._id] === this._duplicateId) {
            return false;
        }
        this.push(value);
        return true;
    }

    /**
     * Resets the active data to an empty array.
     */
    public reset(): void {
        super.reset();
        this._duplicateId++;
    }

    /**
     * Concats the active data with a given array.
     * This ensures no duplicate will be present in the result.
     * @param array defines the data to concatenate with.
     */
    public concatWithNoDuplicate(array: any): void {
        if (array.length === 0) {
            return;
        }
        if (this.length + array.length > this.data.length) {
            this.data.length = (this.length + array.length) * 2;
        }

        for (var index = 0; index < array.length; index++) {
            var item = (array.data || array)[index];
            this.pushNoDuplicate(item);
        }
    }
}
