/**
 * A class acting as a view of our dynamic float32array used in the performance viewer
 */
export class DynamicFloat32ArrayView {
    protected _view: Float32Array;
    protected _itemLength: number;

    /**
     * Creates a new DynamicFloat32ArrayView with the desired item capacity.
     * @param _itemCapacity The initial item capacity you would like to set for the array.
     */
    constructor(protected _itemCapacity: number) {
        this._view = new Float32Array(_itemCapacity);
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
     * Gets a immutable subarray of the original array from start to end (exclusive of end).
     * @param start starting index.
     * @param end ending index.
     * @returns a subarray of the original array.
     */
    public subarray(start: number, end: number): DynamicFloat32ArrayView {
        if (end >= start || start < 0) {
            return new DynamicFloat32ArrayView(0);
        }

        if (end > this._itemLength) {
            end = this._itemLength;
        }

        const sub = new DynamicFloat32ArrayView(end - start);

        for (let i = start; i < end; i++) {
            sub._view[i - start] = this._view[i];
            sub._itemLength++;
        }

        return sub;
    }
}