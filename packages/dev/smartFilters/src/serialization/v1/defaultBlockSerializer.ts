import { ShaderBlock } from "../../blockFoundation/shaderBlock.js";
import type { BaseBlock } from "../../blockFoundation/baseBlock.js";
import type { ISerializedBlockV1, SerializeBlockV1 } from "./smartFilterSerialization.types.js";

/**
 * The default V1 block serializer which can be used for any block that relies only on ConnectionPoints
 * and does not have any constructor parameters or class properties that need to be serialized.
 * @param block - The block to serialize
 * @returns The serialized block
 */
export const DefaultBlockSerializer: SerializeBlockV1 = (block: BaseBlock): ISerializedBlockV1 => {
    return {
        name: block.name,
        uniqueId: block.uniqueId,
        blockType: block.blockType,
        namespace: block.namespace,
        comments: block.comments,
        data: undefined,
        outputTextureOptions: block instanceof ShaderBlock ? block.outputTextureOptions : undefined,
    };
};
