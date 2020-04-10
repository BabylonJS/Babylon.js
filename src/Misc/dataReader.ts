import { StringTools } from './stringTools';

/**
 * Interface for a data buffer
 */
export interface IDataBuffer {
    /**
     * Reads bytes from the data buffer.
     * @param byteOffset The byte offset to read
     * @param byteLength The byte length to read
     * @returns A promise that resolves when the bytes are read
     */
    readAsync(byteOffset: number, byteLength: number): Promise<ArrayBufferView>;

    /**
     * The byte length of the buffer.
     */
    readonly byteLength: number;
}

/**
 * Utility class for reading from a data buffer
 */
export class DataReader {
    /**
     * The data buffer associated with this data reader.
     */
    public readonly buffer: IDataBuffer;

    /**
     * The current byte offset from the beginning of the data buffer.
     */
    public byteOffset = 0;

    private _dataView: DataView;
    private _dataByteOffset: number;

    /**
     * Constructor
     * @param buffer The buffer to read
     */
    constructor(buffer: IDataBuffer) {
        this.buffer = buffer;
    }

    /**
     * Loads the given byte length.
     * @param byteLength The byte length to load
     * @returns A promise that resolves when the load is complete
     */
    public loadAsync(byteLength: number): Promise<void> {
        delete this._dataView;
        delete this._dataByteOffset;

        return this.buffer.readAsync(this.byteOffset, byteLength).then((data) => {
            this._dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
            this._dataByteOffset = 0;
        });
    }

    /**
     * Read a unsigned 32-bit integer from the currently loaded data range.
     * @returns The 32-bit integer read
     */
    public readUint32(): number {
        const value = this._dataView.getUint32(this._dataByteOffset, true);
        this._dataByteOffset += 4;
        this.byteOffset += 4;
        return value;
    }

    /**
     * Read a byte array from the currently loaded data range.
     * @param byteLength The byte length to read
     * @returns The byte array read
     */
    public readUint8Array(byteLength: number): Uint8Array {
        const value = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._dataByteOffset, byteLength);
        this._dataByteOffset += byteLength;
        this.byteOffset += byteLength;
        return value;
    }

    /**
     * Read a string from the currently loaded data range.
     * @param byteLength The byte length to read
     * @returns The string read
     */
    public readString(byteLength: number): string {
        return StringTools.Decode(this.readUint8Array(byteLength));
    }

    /**
     * Skips the given byte length the currently loaded data range.
     * @param byteLength The byte length to skip
     */
    public skipBytes(byteLength: number): void {
        this._dataByteOffset += byteLength;
        this.byteOffset += byteLength;
    }
}
