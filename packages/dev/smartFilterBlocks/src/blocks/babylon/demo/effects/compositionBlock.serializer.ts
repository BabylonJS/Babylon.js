import type { CompositionBlock } from "./compositionBlock.js";
import { compositionBlockType } from "../../../blockTypes.js";
import { babylonDemoEffectsNamespace } from "../../../blockNamespaces.js";
import type { IBlockSerializerV1, BaseBlock } from "smart-filters";

/**
 * The V1 serializer for a Composition Block
 */
export const CompositionBlockSerializer: IBlockSerializerV1 = {
    blockType: compositionBlockType,
    serialize: (block: BaseBlock) => {
        if (block.getClassName() !== compositionBlockType) {
            throw new Error("Was asked to serialize an unrecognized block type");
        }

        const compositionBlock = block as unknown as CompositionBlock;
        return {
            name: block.name,
            uniqueId: block.uniqueId,
            blockType: compositionBlockType,
            namespace: babylonDemoEffectsNamespace,
            comments: block.comments,
            data: {
                alphaMode: compositionBlock.alphaMode,
            },
        };
    },
};
