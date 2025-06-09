import type { ISerializedBlockV1, SmartFilter } from "@babylonjs/smart-filters";
import { CompositionBlock } from "./compositionBlock.js";

/**
 * The definition of the extra data serialized for composition blocks.
 */
export interface ISerializedCompositionBlockV1 extends ISerializedBlockV1 {
    /**
     * The extra data of the block.
     */
    data: {
        /**
         * The alpha mode of the composition.
         */
        alphaMode: number;
    };
}

/**
 * V1 Composition Deserializer.
 * @param smartFilter - The SmartFilter to deserialize the block into
 * @param serializedBlock - The serialized block data
 * @returns A deserialized CompositionBlock
 */
export function compositionDeserializer(smartFilter: SmartFilter, serializedBlock: ISerializedCompositionBlockV1) {
    const block = new CompositionBlock(smartFilter, serializedBlock.name);

    // If data is missing, use the default value set by the block
    block.alphaMode = serializedBlock.data.alphaMode ?? block.alphaMode;
    return block;
}
