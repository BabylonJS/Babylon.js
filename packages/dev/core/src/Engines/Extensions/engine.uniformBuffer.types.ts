import { type FloatArray, type Nullable } from "../../types";
import { type DataBuffer } from "../../Buffers/dataBuffer";
import { type IPipelineContext } from "../IPipelineContext";
declare module "../../Engines/thinEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ThinEngine {
        /**
         * Create an uniform buffer
         * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
         * @param elements defines the content of the uniform buffer
         * @param label defines a name for the buffer (for debugging purpose)
         * @returns the webGL uniform buffer
         */
        createUniformBuffer(elements: FloatArray, label?: string): DataBuffer;

        /**
         * Create a dynamic uniform buffer
         * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
         * @param elements defines the content of the uniform buffer
         * @param label defines a name for the buffer (for debugging purpose)
         * @returns the webGL uniform buffer
         */
        createDynamicUniformBuffer(elements: FloatArray, label?: string): DataBuffer;

        /**
         * Update an existing uniform buffer
         * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
         * @param uniformBuffer defines the target uniform buffer
         * @param elements defines the content to update
         * @param offset defines the offset in the uniform buffer where update should start
         * @param count defines the size of the data to update
         */
        updateUniformBuffer(uniformBuffer: DataBuffer, elements: FloatArray, offset?: number, count?: number): void;

        /**
         * Bind an uniform buffer to the current webGL context
         * @param buffer defines the buffer to bind
         */
        bindUniformBuffer(buffer: Nullable<DataBuffer>): void;

        /**
         * Bind a buffer to the current webGL context at a given location
         * @param buffer defines the buffer to bind
         * @param location defines the index where to bind the buffer
         * @param name Name of the uniform variable to bind
         */
        bindUniformBufferBase(buffer: DataBuffer, location: number, name: string): void;

        /**
         * Bind a specific block at a given index in a specific shader program
         * @param pipelineContext defines the pipeline context to use
         * @param blockName defines the block name
         * @param index defines the index where to bind the block
         */
        bindUniformBlock(pipelineContext: IPipelineContext, blockName: string, index: number): void;
    }
}
