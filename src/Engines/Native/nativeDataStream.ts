import { INative, INativeDataStream } from "./nativeInterfaces";

declare const _native: INative;

/** @hidden */
export type NativeData = Uint32Array;

/** @hidden */
export class NativeDataStream {
    private readonly _data: DataView;
    private readonly _uint32s: Uint32Array;
    private readonly _int32s: Int32Array;
    private readonly _float32s: Float32Array;
    private _position: number;
    private _nativeDataStream: INativeDataStream;

    private static readonly DEFAULT_BUFFER_SIZE = 1024;

    constructor () {
        const buffer = new ArrayBuffer(NativeDataStream.DEFAULT_BUFFER_SIZE);
        this._data = new DataView(buffer);
        this._uint32s = new Uint32Array(buffer);
        this._int32s = new Int32Array(buffer);
        this._float32s = new Float32Array(buffer);

        this._position = 0;

        this._nativeDataStream = new _native.NativeDataStream(() => {
            this._flush();
        });
    }

    public writeUint8(value: number): void {
        this._autoFlushIfNecessary(1);
        this._data.setUint8(this._position, value);
        this._position += 1;
    }

    public writeUint32(value: number): void {
        this._autoFlushIfNecessary(4);
        this._data.setUint32(this._position, value, true);
        this._position += 4;
    }

    public writeInt32(value: number): void {
        this._autoFlushIfNecessary(4);
        this._data.setInt32(this._position, value, true);
        this._position += 4;
    }

    public writeFloat32(value: number): void {
        this._autoFlushIfNecessary(4);
        this._data.setFloat32(this._position, value, true);
        this._position += 4;
    }

    public writeUint32Array(values: Uint32Array): void {
        this._byteAlign4();
        this._autoFlushIfNecessary(4 + values.byteLength);
        const index = NativeDataStream._positionToIndex(this._position);
        this._uint32s[index] = values.length;
        this._uint32s.set(values, index + 1);
        this._position = NativeDataStream._indexToPosition(index + values.length + 1);
    }

    public writeInt32Array(values: Int32Array): void {
        this._byteAlign4();
        this._autoFlushIfNecessary(4 + values.byteLength);
        const index = NativeDataStream._positionToIndex(this._position);
        this._uint32s[index] = values.length;
        this._int32s.set(values, index + 1);
        this._position = NativeDataStream._indexToPosition(index + values.length + 1);
    }

    public writeFloat32Array(values: Float32Array): void {
        this._byteAlign4();
        this._autoFlushIfNecessary(4 + values.byteLength);
        const index = NativeDataStream._positionToIndex(this._position);
        this._uint32s[index] = values.length;
        this._float32s.set(values, index + 1);
        this._position = NativeDataStream._indexToPosition(index + values.length + 1);
    }

    public writeNativeData(handle: NativeData) {
        this.writeUint32Array(handle);
    }

    public writeBoolean(value: boolean) {
        this.writeUint32(value ? 1 : 0);
    }

    private _byteAlign4(): void {
        this._position = NativeDataStream._indexToPosition(NativeDataStream._positionToIndex(this._position));
    }

    private _autoFlushIfNecessary(requiredBytes: number): void {
        if (this._position + requiredBytes > this._data.byteLength) {
            this._flush();
        }
    }

    private _flush(): void {
        this._nativeDataStream.writeBytes(this._data.buffer, this._position);
        this._position = 0;
    }

    private static _positionToIndex(position: number): number {
        return position % 4 === 0 ? position / 4 : Math.floor(position / 4) + 1;
    }

    private static _indexToPosition(index: number): number {
        return 4 * index;
    }
}
