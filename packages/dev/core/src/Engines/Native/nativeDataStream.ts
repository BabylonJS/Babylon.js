import type { INative, INativeDataStream } from "./nativeInterfaces";

declare const _native: INative;

/** @internal */
export type NativeData = Uint32Array;

/** @internal */
export class NativeDataStream {
    private readonly _uint32s: Uint32Array;
    private readonly _int32s: Int32Array;
    private readonly _float32s: Float32Array;
    private readonly _length: number;
    private _position: number;
    private readonly _nativeDataStream: INativeDataStream;

    // Must be multiple of 4!
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static readonly DEFAULT_BUFFER_SIZE = 65536;

    constructor() {
        const buffer = new ArrayBuffer(NativeDataStream.DEFAULT_BUFFER_SIZE);
        this._uint32s = new Uint32Array(buffer);
        this._int32s = new Int32Array(buffer);
        this._float32s = new Float32Array(buffer);

        this._length = NativeDataStream.DEFAULT_BUFFER_SIZE / 4;
        this._position = 0;

        this._nativeDataStream = new _native.NativeDataStream(() => {
            this._flush();
        });
    }

    public writeUint32(value: number): void {
        this._flushIfNecessary(1);
        this._uint32s[this._position++] = value;
    }

    public writeInt32(value: number): void {
        this._flushIfNecessary(1);
        this._int32s[this._position++] = value;
    }

    public writeFloat32(value: number): void {
        this._flushIfNecessary(1);
        this._float32s[this._position++] = value;
    }

    public writeUint32Array(values: Uint32Array): void {
        this._flushIfNecessary(1 + values.length);
        this._uint32s[this._position++] = values.length;
        this._uint32s.set(values, this._position);
        this._position += values.length;
    }

    public writeInt32Array(values: Int32Array): void {
        this._flushIfNecessary(1 + values.length);
        this._uint32s[this._position++] = values.length;
        this._int32s.set(values, this._position);
        this._position += values.length;
    }

    public writeFloat32Array(values: Float32Array): void {
        this._flushIfNecessary(1 + values.length);
        this._uint32s[this._position++] = values.length;
        this._float32s.set(values, this._position);
        this._position += values.length;
    }

    public writeNativeData(handle: NativeData) {
        this._flushIfNecessary(handle.length);
        this._uint32s.set(handle, this._position);
        this._position += handle.length;
    }

    public writeBoolean(value: boolean) {
        this.writeUint32(value ? 1 : 0);
    }

    private _flushIfNecessary(required: number): void {
        if (this._position + required > this._length) {
            this._flush();
        }
    }

    private _flush(): void {
        this._nativeDataStream.writeBuffer(this._uint32s.buffer, this._position);
        this._position = 0;
    }
}
