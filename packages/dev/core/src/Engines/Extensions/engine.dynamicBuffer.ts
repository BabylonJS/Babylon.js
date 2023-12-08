import { ThinEngine } from "../../Engines/thinEngine";
import type { DataBuffer } from "../../Buffers/dataBuffer";
import type { IndicesArray, DataArray } from "../../types";
import { updateDynamicIndexBuffer, updateDynamicVertexBuffer } from "core/esm/Engines/WebGL/Extensions/dynamicBuffer/dynamicBuffer.webgl";

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ThinEngine.prototype.updateDynamicIndexBuffer = function (this: ThinEngine, indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
    updateDynamicIndexBuffer(this._engineState, indexBuffer, indices, offset);
};

ThinEngine.prototype.updateDynamicVertexBuffer = function (this: ThinEngine, vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
    updateDynamicVertexBuffer(this._engineState, vertexBuffer, data, byteOffset, byteLength);
};
