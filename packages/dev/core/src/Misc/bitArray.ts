function getByteIndex(bitIndex: number): number {
    return Math.floor(bitIndex / 8);
}

function getBitMask(bitIndex: number): number {
    return 1 << bitIndex % 8;
}

/**
 * An array that effectively stores boolean values where each value is a single bit of backing data.
 * @remarks
 * All bits are initialized to false.
 */
export class BitArray {
    private readonly _byteArray: Uint8Array;

    public constructor(private readonly _size: number) {
        this._byteArray = new Uint8Array(Math.ceil(this._size / 8));
    }

    /**
     * Gets the current value at the specified index.
     * @param bitIndex The index to get the value from.
     * @returns The value at the specified index.
     */
    public get(bitIndex: number): boolean {
        if (bitIndex >= this._size) {
            throw new RangeError("Bit index out of range");
        }
        const byteIndex = getByteIndex(bitIndex);
        const bitMask = getBitMask(bitIndex);
        return (this._byteArray[byteIndex] & bitMask) !== 0;
    }

    /**
     * Sets the value at the specified index.
     * @param bitIndex The index to set the value at.
     * @param value The value to set.
     */
    public set(bitIndex: number, value: boolean): void {
        if (bitIndex >= this._size) {
            throw new RangeError("Bit index out of range");
        }
        const byteIndex = getByteIndex(bitIndex);
        const bitMask = getBitMask(bitIndex);
        if (value) {
            this._byteArray[byteIndex] |= bitMask;
        } else {
            this._byteArray[byteIndex] &= ~bitMask;
        }
    }
}
