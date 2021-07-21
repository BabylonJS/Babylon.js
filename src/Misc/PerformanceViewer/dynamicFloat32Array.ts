const growthFactor = 1.5;

/**
 * A class acting as a dynamic float32array used in the performance viewer
 */
export class DynamicFloat32Array {
    private _view: Float32Array;
    private _itemLength: number;

    /**
     * Creates a new DynamicFloat32Array with the desired item capacity.
     * @param itemCapacity The initial item capacity you would like to set for the array.
     */
     constructor(itemCapacity: number) {
        this._view = new Float32Array(itemCapacity);
        this._itemLength = 0;
    }

    /**
     * The number of items currently in the array.
     */
    public get itemLength(): number {
        return this._itemLength;
    }

    /**
     * Gets value at index, NaN if no such index exists.
     * @param index the index to get the value at.
     * @returns the value at the index provided.
     */
    public at(index: number): number {
        if (index < 0 || index >= this._itemLength) {
            return NaN;
        }

        return this._view[index];
    }

    /**
     * Gets a view of the original array from start to end (exclusive of end).
     * @param start starting index.
     * @param end ending index.
     * @returns a subarray of the original array.
     */
    public subarray(start: number, end: number): Float32Array {
        if (end >= start || start < 0) {
            return new Float32Array(0);
        }

        if (end > this._itemLength) {
            end = this._itemLength;
        }

        return this._view.subarray(start, end);
    }

    /**
     * Pushes items to the end of the array.
     * @param item The item to push into the array.
     */
     public push(item: number) {
        this._view[this._itemLength] = item;
        this._itemLength++;
        if (this._itemLength >= this._view.length) {
            this._growArray();
        }
    }

    /**
     * Grows the array by the growth factor when necessary.
     */
    private _growArray() {
        const newCapacity = Math.floor(this._view.length * growthFactor);
        const view = new Float32Array(newCapacity);
        view.set(this._view);
        this._view = view;
    }
}