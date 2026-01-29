/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable babylonjs/available */
import type { TypedArray } from "core/types";

const TypedArrayToWriteMethod = new Map<Function, (dataView: DataView, byteOffset: number, value: number) => void>([
    [Int8Array, (d, b, v) => d.setInt8(b, v)],
    [Uint8Array, (dv, bo, v) => dv.setUint8(bo, v)],
    [Uint8ClampedArray, (dv, bo, v) => dv.setUint8(bo, v)],
    [Int16Array, (dv, bo, v) => dv.setInt16(bo, v, true)],
    [Uint16Array, (dv, bo, v) => dv.setUint16(bo, v, true)],
    [Int32Array, (dv, bo, v) => dv.setInt32(bo, v, true)],
    [Uint32Array, (dv, bo, v) => dv.setUint32(bo, v, true)],
    [Float32Array, (dv, bo, v) => dv.setFloat32(bo, v, true)],
    [Float64Array, (dv, bo, v) => dv.setFloat64(bo, v, true)],
]);

/** @internal */
export class DataWriter {
    private _data: Uint8Array<ArrayBuffer>;
    private _dataView: DataView;
    private _byteOffset: number;

    public writeTypedArray(value: Exclude<TypedArray, BigInt64Array | BigUint64Array>): void {
        this._checkGrowBuffer(value.byteLength);
        const setMethod = TypedArrayToWriteMethod.get(value.constructor)!;
        for (let i = 0; i < value.length; i++) {
            setMethod(this._dataView, this._byteOffset, value[i]);
            this._byteOffset += value.BYTES_PER_ELEMENT;
        }
    }

    public constructor(byteLength: number) {
        this._data = new Uint8Array(byteLength);
        this._dataView = new DataView(this._data.buffer);
        this._byteOffset = 0;
    }

    public get byteOffset(): number {
        return this._byteOffset;
    }

    public getOutputData(): Uint8Array<ArrayBuffer> {
        return new Uint8Array(this._data.buffer, 0, this._byteOffset);
    }

    public writeUInt8(value: number): void {
        this._checkGrowBuffer(1);
        this._dataView.setUint8(this._byteOffset, value);
        this._byteOffset++;
    }

    public writeInt8(value: number): void {
        this._checkGrowBuffer(1);
        this._dataView.setInt8(this._byteOffset, value);
        this._byteOffset++;
    }

    public writeInt16(entry: number): void {
        this._checkGrowBuffer(2);
        this._dataView.setInt16(this._byteOffset, entry, true);
        this._byteOffset += 2;
    }

    public writeUInt16(value: number): void {
        this._checkGrowBuffer(2);
        this._dataView.setUint16(this._byteOffset, value, true);
        this._byteOffset += 2;
    }

    public writeInt32(entry: number): void {
        this._checkGrowBuffer(4);
        this._dataView.setInt32(this._byteOffset, entry, true);
        this._byteOffset += 4;
    }

    public writeUInt32(value: number): void {
        this._checkGrowBuffer(4);
        this._dataView.setUint32(this._byteOffset, value, true);
        this._byteOffset += 4;
    }

    public writeFloat32(value: number): void {
        this._checkGrowBuffer(4);
        this._dataView.setFloat32(this._byteOffset, value, true);
        this._byteOffset += 4;
    }

    public writeFloat64(value: number): void {
        this._checkGrowBuffer(8);
        this._dataView.setFloat64(this._byteOffset, value, true);
        this._byteOffset += 8;
    }

    private _checkGrowBuffer(byteLength: number): void {
        const newByteLength = this.byteOffset + byteLength;
        if (newByteLength > this._data.byteLength) {
            const newData = new Uint8Array(newByteLength * 2);
            newData.set(this._data);
            this._data = newData;
            this._dataView = new DataView(this._data.buffer);
        }
    }
}
