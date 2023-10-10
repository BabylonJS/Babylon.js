import type { DataBuffer } from "@babylonjs/core/Buffers/dataBuffer.js";
import type { DataArray, IndicesArray } from "@babylonjs/core/types.js";
import type { IBaseEnginePublic } from "../../engine.base.js";

export interface IDynamicBufferEngineExtension {
    /**
     * Update a dynamic index buffer
     * @param indexBuffer defines the target index buffer
     * @param indices defines the data to update
     * @param offset defines the offset in the target index buffer where update should start
     */
    updateDynamicIndexBuffer(engineState: IBaseEnginePublic, indexBuffer: DataBuffer, indices: IndicesArray, offset?: number): void;

    /**
     * Updates a dynamic vertex buffer.
     * @param vertexBuffer the vertex buffer to update
     * @param data the data used to update the vertex buffer
     * @param byteOffset the byte offset of the data
     * @param byteLength the byte length of the data
     */
    updateDynamicVertexBuffer(engineState: IBaseEnginePublic, vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void;
}