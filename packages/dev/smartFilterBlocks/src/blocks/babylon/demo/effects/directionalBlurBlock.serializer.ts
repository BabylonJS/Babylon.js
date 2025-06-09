import type { IBlockSerializerV1, BaseBlock } from "@babylonjs/smart-filters";
import type { DirectionalBlurBlock } from "./directionalBlurBlock";
import { directionalBlurBlockType } from "../../../blockTypes.js";
import { babylonDemoEffectsNamespace } from "../../../blockNamespaces.js";

/**
 * The V1 serializer for a Directional Blur Block
 */
export const directionalBlurBlockSerializer: IBlockSerializerV1 = {
    blockType: directionalBlurBlockType,
    serialize: (block: BaseBlock) => {
        if (block.getClassName() !== directionalBlurBlockType) {
            throw new Error("Was asked to serialize an unrecognized block type");
        }

        const directionalBlurBlock = block as DirectionalBlurBlock;
        return {
            name: block.name,
            uniqueId: block.uniqueId,
            blockType: directionalBlurBlockType,
            namespace: babylonDemoEffectsNamespace,
            comments: block.comments,
            data: {
                blurTextureRatio: directionalBlurBlock.blurTextureRatio,
                blurHorizontalWidth: directionalBlurBlock.blurHorizontalWidth,
                blurVerticalWidth: directionalBlurBlock.blurVerticalWidth,
            },
        };
    },
};
