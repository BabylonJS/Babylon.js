const growthFactor = 1.5;
const bytesPerItem = 32 / 8;

/**
 * A class acting as a growable float32array used in the performance viewer
 */
export class GrowableFloat32Array {
    private _view: Float32Array;
    private _length: number;

    constructor(private _capacity: number){
        const buffer = new ArrayBuffer(_capacity * bytesPerItem);
        this._view = new Float32Array(buffer);
        this._length = 0;
    }

    /**
     * The number of items currently in the array.
     */
    public get length(): number {
        return this._length;
    }

    /**
     * Pushes items to the end of the array.
     * 
     * @param item The item to push into the array. 
     */
    public push(item: number) {
        this._view[this._length] = item;
        this._length++;
        if (this._length >= this._capacity) {
            this._growArray();
        }
    }

    /**
     * Gets value at index, NaN if no such index exists.
     * 
     * @param index the index to get the value at.
     * @returns the value at the index provided.
     */
    public at(index: number): number {
        if (index < 0 || index >= this._length) {
            return NaN;
        }

        return this._view[index];
    }

    /**
     * Gets a view of the original array from start to end (exclusive of end).
     * 
     * @param start starting index.
     * @param end ending index.
     * @returns a subarray of the original array.
     */
    public subarray(start: number, end: number): GrowableFloat32Array {
        if (end >= start || start < 0) {
            return new GrowableFloat32Array(0);
        }

        if (end > this._length) {
            end = this._length;
        }

        const sub = new GrowableFloat32Array(end - start);

        for (let i = start; i < end; i++) {
            sub.push(this._view[i]);
        }

        return sub;
    }
    
    /**
     * Grows the array by the growth factor when necessary.
     */
    private _growArray() {
        this._capacity *= growthFactor;
        const buffer = new ArrayBuffer(this._capacity * bytesPerItem);
        const view = new Float32Array(buffer);
        view.set(this._view);
        this._view = view;
    }
}