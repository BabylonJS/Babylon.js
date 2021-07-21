import { DynamicFloat32ArrayView } from "./dynamicFloat32ArrayView";

const growthFactor = 1.5;

/**
 * A class acting as a dynamic float32array used in the performance viewer
 */
export class DynamicFloat32Array extends DynamicFloat32ArrayView {
    /**
     * Creates a new DynamicFloat32Array with the desired item capacity.
     * @param _itemCapacity The initial item capacity you would like to set for the array.
     */
    constructor(_itemCapacity: number) {
        super(_itemCapacity);
    }

    /**
     * Pushes items to the end of the array.
     * @param item The item to push into the array.
     */
     public push(item: number) {
        this._view[this._itemLength] = item;
        this._itemLength++;
        if (this._itemLength >= this._itemCapacity) {
            this._growArray();
        }
    }

    /**
     * Grows the array by the growth factor when necessary.
     */
    private _growArray() {
        this._itemCapacity *= growthFactor;
        const view = new Float32Array(this._itemCapacity);
        view.set(this._view);
        this._view = view;
    }
}