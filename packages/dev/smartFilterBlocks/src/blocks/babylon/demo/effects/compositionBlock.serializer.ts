import type { CompositionBlock } from "./compositionBlock";
import { compositionBlockType } from "../../../blockTypes.js";
import { babylonDemoEffectsNamespace } from "../../../blockNamespaces.js";
import type { IBlockSerializerV1, BaseBlock } from "@babylonjs/smart-filters";

/**
 * The V1 serializer for a Composition Block
 */
export const compositionBlockSerializer: IBlockSerializerV1 = {
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
