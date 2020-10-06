import { ThinEngine } from "../../Engines/thinEngine";
import { DataBuffer } from '../../Meshes/dataBuffer';
import { IndicesArray, DataArray } from "../../types";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Update a dynamic index buffer
         * @param indexBuffer defines the target index buffer
         * @param indices defines the data to update
         * @param offset defines the offset in the target index buffer where update should start
         */
        updateDynamicIndexBuffer(indexBuffer: DataBuffer, indices: IndicesArray, offset?: number): void;

        /**
         * Updates a dynamic vertex buffer.
         * @param vertexBuffer the vertex buffer to update
         * @param data the data used to update the vertex buffer
         * @param byteOffset the byte offset of the data
         * @param byteLength the byte length of the data
         */
        updateDynamicVertexBuffer(vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void;
    }
}

ThinEngine.prototype.updateDynamicIndexBuffer = function(this: ThinEngine, indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
    // Force cache update
    this._currentBoundBuffer[this._gl.ELEMENT_ARRAY_BUFFER] = null;
    this.bindIndexBuffer(indexBuffer);
    var arrayBuffer;

    if (indices instanceof Uint16Array || indices instanceof Uint32Array) {
        arrayBuffer = indices;
    } else {
        arrayBuffer = indexBuffer.is32Bits ? new Uint32Array(indices) : new Uint16Array(indices);
    }

    this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, arrayBuffer, this._gl.DYNAMIC_DRAW);

    this._resetIndexBufferBinding();
};

ThinEngine.prototype.updateDynamicVertexBuffer = function(this: ThinEngine, vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
    this.bindArrayBuffer(vertexBuffer);

    if (byteOffset === undefined) {
        byteOffset = 0;
    }

    const dataLength = (data as number[]).length || (data as ArrayBuffer).byteLength;

    if (byteLength === undefined || byteLength >= dataLength && byteOffset === 0) {
        if (data instanceof Array) {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, new Float32Array(data));
        } else {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, <ArrayBuffer>data);
        }
    } else {
        if (data instanceof Array) {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(data).subarray(byteOffset, byteOffset + byteLength));
        } else {
            if (data instanceof ArrayBuffer) {
                data = new Uint8Array(data, byteOffset, byteLength);
            } else {
                data = new Uint8Array(data.buffer, data.byteOffset + byteOffset, byteLength);
            }

            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, <ArrayBuffer>data);
        }
    }

    this._resetVertexBufferBinding();
};
