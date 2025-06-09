import type { BaseBlock, IBlockSerializerV1 } from "@babylonjs/smart-filters";
import type { BlurBlock } from "./blurBlock";
import { blurBlockType } from "../../../blockTypes.js";
import { babylonDemoEffectsNamespace } from "../../../blockNamespaces.js";

/**
 * The V1 serializer for a Blur Block.
 * Though it is an aggregate block, Blur creates and manages its own blocks
 * internally, so there's no need to worry about serializing them.
 */
export const blurBlockSerializer: IBlockSerializerV1 = {
    blockType: blurBlockType,
    serialize: (block: BaseBlock) => {
        if (block.getClassName() !== blurBlockType) {
            throw new Error("Was asked to serialize an unrecognized block type");
        }

        const blurBlock = block as unknown as BlurBlock;
        return {
            name: block.name,
            uniqueId: block.uniqueId,
            blockType: blurBlockType,
            namespace: babylonDemoEffectsNamespace,
            comments: block.comments,
            data: {
                blurTextureRatioPerPass: blurBlock.blurTextureRatioPerPass,
                blurSize: blurBlock.blurSize,
            },
        };
    },
};
