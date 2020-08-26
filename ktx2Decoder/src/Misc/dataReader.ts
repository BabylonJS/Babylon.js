/**
 * Utility class for reading from a data buffer
 */
export class DataReader {
    /**
     * The current byte offset from the beginning of the data buffer.
     */
    public get byteOffset() {
        return this._dataByteOffset;
    }

    /**
     * Indicates the endianness of the data in the buffer
     */
    public littleEndian = true;

    private _dataView: DataView;
    private _dataByteOffset: number;

    /**
     * Constructor
     * @param buffer The buffer to set
     * @param byteOffset The starting offset in the buffer
     * @param byteLength The byte length of the buffer
     */
    constructor(buffer: ArrayBuffer | ArrayBufferView, byteOffset?: number, byteLength?: number) {
        if ((buffer as  ArrayBufferView).buffer) {
            this._dataView = new DataView((buffer as ArrayBufferView).buffer, (buffer as ArrayBufferView).byteOffset + (byteOffset ?? 0), byteLength ?? (buffer as ArrayBufferView).byteLength);
        } else {
            this._dataView = new DataView(buffer as ArrayBuffer, byteOffset ?? 0, byteLength ?? (buffer as ArrayBuffer).byteLength);
        }

        this._dataByteOffset = 0;
    }

    /**
     * Read a unsigned 8-bit integer from the currently loaded data range.
     * @returns The 8-bit integer read
     */
    public readUint8(): number {
        const value = this._dataView.getUint8(this._dataByteOffset);
        this._dataByteOffset += 1;
        return value;
    }

    /**
     * Read a signed 8-bit integer from the currently loaded data range.
     * @returns The 8-bit integer read
     */
    public readInt8(): number {
        const value = this._dataView.getInt8(this._dataByteOffset);
        this._dataByteOffset += 1;
        return value;
    }

    /**
     * Read a unsigned 16-bit integer from the currently loaded data range.
     * @returns The 16-bit integer read
     */
    public readUint16(): number {
        const value = this._dataView.getUint16(this._dataByteOffset, this.littleEndian);
        this._dataByteOffset += 2;
        return value;
    }

    /**
     * Read a signed 16-bit integer from the currently loaded data range.
     * @returns The 16-bit integer read
     */
    public readInt16(): number {
        const value = this._dataView.getInt16(this._dataByteOffset, this.littleEndian);
        this._dataByteOffset += 2;
        return value;
    }

    /**
     * Read a unsigned 32-bit integer from the currently loaded data range.
     * @returns The 32-bit integer read
     */
    public readUint32(): number {
        const value = this._dataView.getUint32(this._dataByteOffset, this.littleEndian);
        this._dataByteOffset += 4;
        return value;
    }

    /**
     * Read a signed 32-bit integer from the currently loaded data range.
     * @returns The 32-bit integer read
     */
    public readInt32(): number {
        const value = this._dataView.getInt32(this._dataByteOffset, this.littleEndian);
        this._dataByteOffset += 4;
        return value;
    }

    /**
     * Read a unsigned 32-bit integer from the currently loaded data range.
     * @returns The 32-bit integer read
     */
    public readUint64(): number {
        // split 64-bit number into two 32-bit (4-byte) parts
        const left = this._dataView.getUint32(this._dataByteOffset, this.littleEndian);
        const right = this._dataView.getUint32(this._dataByteOffset + 4, this.littleEndian);

        // combine the two 32-bit values
        const combined = this.littleEndian ? left + (2 ** 32 * right) : (2 ** 32 * left) + right;

        /*if (!Number.isSafeInteger(combined)) {
            console.warn('DataReader: ' + combined + ' exceeds MAX_SAFE_INTEGER. Precision may be lost.');
        }*/

        this._dataByteOffset += 8;
        return combined;
    }

    /**
     * Read a byte array from the currently loaded data range.
     * @param byteLength The byte length to read
     * @returns The byte array read
     */
    public readUint8Array(byteLength: number): Uint8Array {
        const value = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._dataByteOffset, byteLength);
        this._dataByteOffset += byteLength;
        return value;
    }

    /**
     * Skips the given byte length the currently loaded data range.
     * @param byteLength The byte length to skip
     * @returns This instance
     */
    public skipBytes(byteLength: number) {
        this._dataByteOffset += byteLength;
        return this;
    }
}
