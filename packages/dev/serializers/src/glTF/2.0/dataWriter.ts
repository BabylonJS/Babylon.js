/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable babylonjs/available */
import type { TypedArray } from "core/types";

/** @internal */
export class DataWriter {
    private _data: Uint8Array;
    private _dataView: DataView;
    private _byteOffset: number;

    private _typedArrayToWriteMethod: Record<string, Function> = {
        Int8Array: this.writeInt8.bind(this),
        Uint8Array: this.writeUInt8.bind(this),
        Uint8ClampedArray: this.writeUInt8.bind(this),
        Int16Array: this.writeInt16.bind(this),
        Uint16Array: this.writeUInt16.bind(this),
        Int32Array: this.writeInt32.bind(this),
        Uint32Array: this.writeUInt32.bind(this),
        Float32Array: this.writeFloat32.bind(this),
    };

    public constructor(byteLength: number) {
        this._data = new Uint8Array(byteLength);
        this._dataView = new DataView(this._data.buffer);
        this._byteOffset = 0;
    }

    public get byteOffset(): number {
        return this._byteOffset;
    }

    public getOutputData(): Uint8Array {
        return new Uint8Array(this._data.buffer, 0, this._byteOffset);
    }

    public writeTypedArray(value: TypedArray): void {
        this._checkGrowBuffer(value.byteLength);
        const setMethod = this._typedArrayToWriteMethod[value.constructor.name];
        for (let i = 0; i < value.length; i++) {
            setMethod(value[i]);
        }
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

    public writeInt16(value: number): void {
        this._checkGrowBuffer(2);
        this._dataView.setInt16(this._byteOffset, value, true);
        this._byteOffset += 2;
    }

    public writeUInt16(value: number): void {
        this._checkGrowBuffer(2);
        this._dataView.setUint16(this._byteOffset, value, true);
        this._byteOffset += 2;
    }

    public writeInt32(value: number): void {
        this._checkGrowBuffer(4);
        this._dataView.setInt32(this._byteOffset, value, true);
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
