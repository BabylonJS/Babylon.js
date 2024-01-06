import type { Nullable } from "core/types";
import type { DataBuffer } from "./dataBuffer";
import { Buffer, VertexBuffer } from "./buffer";

const isLittleEndian = (() => {
    const array = new Uint8Array(4);
    const view = new Uint32Array(array.buffer);

    return !!((view[0] = 1) & array[0]);
})();

declare module "./buffer" {
    export interface VertexBuffer {
        /**
         * Gets the effective byte stride, that is the byte stride of the buffer that is actually sent to the GPU.
         * It could be different from VertexBuffer.byteStride if a new buffer must be created under the hood because of the forceVertexBufferStrideMultiple4Bytes engine flag.
         */
        effectiveByteStride: number;

        /**
         * Gets the effective byte offset, that is the byte offset of the buffer that is actually sent to the GPU.
         * It could be different from VertexBuffer.byteOffset if a new buffer must be created under the hood because of the forceVertexBufferStrideMultiple4Bytes engine flag.
         */
        effectiveByteOffset: number;

        /**
         * Gets the effective buffer, that is the buffer that is actually sent to the GPU.
         * It could be different from VertexBuffer.getBuffer() if a new buffer must be created under the hood because of the forceVertexBufferStrideMultiple4Bytes engine flag.
         */
        effectiveBuffer: Nullable<DataBuffer>;

        /** @internal */
        _alignBuffer(): void;

        /** @internal */
        _alignedBuffer?: Buffer;
    }
}

Object.defineProperty(VertexBuffer.prototype, "effectiveByteStride", {
    get: function (this: VertexBuffer) {
        return (this._alignedBuffer && this._alignedBuffer.byteStride) || this.byteStride;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(VertexBuffer.prototype, "effectiveByteOffset", {
    get: function (this: VertexBuffer) {
        return this._alignedBuffer ? 0 : this.byteOffset;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(VertexBuffer.prototype, "effectiveBuffer", {
    get: function (this: VertexBuffer) {
        return (this._alignedBuffer && this._alignedBuffer.getBuffer()) || this._buffer.getBuffer();
    },
    enumerable: true,
    configurable: true,
});

VertexBuffer.prototype._rebuild = function (): void {
    this._buffer?._rebuild();
    this._alignedBuffer?._rebuild();
};

VertexBuffer.prototype.dispose = function (): void {
    if (this._ownsBuffer) {
        this._buffer.dispose();
    }

    this._alignedBuffer?.dispose();
    this._alignedBuffer = undefined;

    this._isDisposed = true;
};

VertexBuffer.prototype.getWrapperBuffer = function (): Buffer {
    return this._alignedBuffer || this._buffer;
};

VertexBuffer.prototype._alignBuffer = function (): void {
    const data = this._buffer.getData();

    if (!this.engine._features.forceVertexBufferStrideMultiple4Bytes || this.byteStride % 4 === 0 || !data) {
        return;
    }

    const typeByteLength = VertexBuffer.GetTypeByteLength(this.type);
    const alignedByteStride = (this.byteStride + 3) & ~3;
    const alignedSize = alignedByteStride / typeByteLength;
    const totalVertices = this._maxVerticesCount;
    const totalByteLength = totalVertices * alignedByteStride;
    const totalLength = totalByteLength / typeByteLength;

    let sourceData: DataView;

    if (Array.isArray(data)) {
        const sourceDataAsFloat = new Float32Array(data);
        sourceData = new DataView(sourceDataAsFloat.buffer, sourceDataAsFloat.byteOffset, sourceDataAsFloat.byteLength);
    } else if (data instanceof ArrayBuffer) {
        sourceData = new DataView(data, 0, data.byteLength);
    } else {
        sourceData = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }

    let alignedData: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array;

    if (this.type === VertexBuffer.BYTE) {
        alignedData = new Int8Array(totalLength);
    } else if (this.type === VertexBuffer.UNSIGNED_BYTE) {
        alignedData = new Uint8Array(totalLength);
    } else if (this.type === VertexBuffer.SHORT) {
        alignedData = new Int16Array(totalLength);
    } else if (this.type === VertexBuffer.UNSIGNED_SHORT) {
        alignedData = new Uint16Array(totalLength);
    } else if (this.type === VertexBuffer.INT) {
        alignedData = new Int32Array(totalLength);
    } else if (this.type === VertexBuffer.UNSIGNED_INT) {
        alignedData = new Uint32Array(totalLength);
    } else {
        alignedData = new Float32Array(totalLength);
    }

    const numComponents = this.getSize();

    let sourceOffset = this.byteOffset;

    for (let i = 0; i < totalVertices; ++i) {
        for (let j = 0; j < numComponents; ++j) {
            switch (this.type) {
                case VertexBuffer.BYTE:
                    alignedData[i * alignedSize + j] = sourceData.getInt8(sourceOffset + j);
                    break;
                case VertexBuffer.UNSIGNED_BYTE:
                    alignedData[i * alignedSize + j] = sourceData.getUint8(sourceOffset + j);
                    break;
                case VertexBuffer.SHORT:
                    alignedData[i * alignedSize + j] = sourceData.getInt16(sourceOffset + j * 2, isLittleEndian);
                    break;
                case VertexBuffer.UNSIGNED_SHORT:
                    alignedData[i * alignedSize + j] = sourceData.getUint16(sourceOffset + j * 2, isLittleEndian);
                    break;
                case VertexBuffer.INT:
                    alignedData[i * alignedSize + j] = sourceData.getInt32(sourceOffset + j * 4, isLittleEndian);
                    break;
                case VertexBuffer.UNSIGNED_INT:
                    alignedData[i * alignedSize + j] = sourceData.getUint32(sourceOffset + j * 4, isLittleEndian);
                    break;
                case VertexBuffer.FLOAT:
                    alignedData[i * alignedSize + j] = sourceData.getFloat32(sourceOffset + j * 4, isLittleEndian);
                    break;
            }
        }
        sourceOffset += this.byteStride;
    }

    this._alignedBuffer?.dispose();
    this._alignedBuffer = new Buffer(
        this.engine,
        alignedData,
        false,
        alignedByteStride,
        false,
        this.getIsInstanced(),
        true,
        this.instanceDivisor,
        (this._label ?? "VertexBuffer") + "_aligned"
    );
};
