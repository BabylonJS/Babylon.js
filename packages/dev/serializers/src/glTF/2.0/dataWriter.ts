/* eslint-disable babylonjs/available */

/** @internal */
export class DataWriter {
    private _data: Uint8Array;
    private _dataView: DataView;
    private _byteOffset: number;

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

    public writeUInt8(value: number): void {
        this._checkGrowBuffer(1);
        this._dataView.setUint8(this._byteOffset, value);
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

    public writeUInt32(entry: number): void {
        this._checkGrowBuffer(4);
        this._dataView.setUint32(this._byteOffset, entry, true);
        this._byteOffset += 4;
    }

    public writeFloat32(value: number): void {
        this._checkGrowBuffer(4);
        this._dataView.setFloat32(this._byteOffset, value, true);
        this._byteOffset += 4;
    }

    public writeUint8Array(value: Uint8Array): void {
        this._checkGrowBuffer(value.byteLength);
        this._data.set(value, this._byteOffset);
        this._byteOffset += value.byteLength;
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
