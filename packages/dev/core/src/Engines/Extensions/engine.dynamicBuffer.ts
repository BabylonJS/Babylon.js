import { ThinEngine } from "../../Engines/thinEngine";
import type { DataBuffer } from "../../Buffers/dataBuffer";
import type { IndicesArray, DataArray } from "../../types";

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ThinEngine.prototype.updateDynamicIndexBuffer = function (this: ThinEngine, indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
    // Force cache update
    this._currentBoundBuffer[this._gl.ELEMENT_ARRAY_BUFFER] = null;
    this.bindIndexBuffer(indexBuffer);

    let view: ArrayBufferView;
    if (indexBuffer.is32Bits) {
        // anything else than Uint32Array needs to be converted to Uint32Array
        view = indices instanceof Uint32Array ? indices : new Uint32Array(indices);
    } else {
        // anything else than Uint16Array needs to be converted to Uint16Array
        view = indices instanceof Uint16Array ? indices : new Uint16Array(indices);
    }

    this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, view, this._gl.DYNAMIC_DRAW);

    this._resetIndexBufferBinding();
};

ThinEngine.prototype.updateDynamicVertexBuffer = function (this: ThinEngine, vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
    this.bindArrayBuffer(vertexBuffer);

    if (byteOffset === undefined) {
        byteOffset = 0;
    }

    const dataLength = (data as ArrayBuffer).byteLength || (data as number[]).length;

    if (byteLength === undefined || (byteLength >= dataLength && byteOffset === 0)) {
        if (data instanceof Array) {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, new Float32Array(data));
        } else {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, data);
        }
    } else {
        if (data instanceof Array) {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, new Float32Array(data).subarray(0, byteLength / 4));
        } else {
            if (ArrayBuffer.isView(data)) {
                data = new Uint8Array(data.buffer, data.byteOffset, byteLength);
            } else {
                data = new Uint8Array(data, 0, byteLength);
            }

            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, data);
        }
    }

    this._resetVertexBufferBinding();
};
