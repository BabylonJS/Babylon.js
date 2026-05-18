import { type DataBuffer } from "../../Buffers/dataBuffer";
import { type IndicesArray, type DataArray } from "../../types";
declare module "../../Engines/abstractEngine.pure" {
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
