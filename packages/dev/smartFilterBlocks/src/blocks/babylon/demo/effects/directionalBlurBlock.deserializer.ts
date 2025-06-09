import type { ISerializedBlockV1, SmartFilter } from "@babylonjs/smart-filters";
import { DirectionalBlurBlock } from "./directionalBlurBlock.js";

/**
 * The definition of the extra data serialized for directional blur blocks.
 */
export interface ISerializedDirectionalBlurBlockV1 extends ISerializedBlockV1 {
    /**
     * The extra data of the block.
     */
    data: {
        /**
         * The horizontal width of the blur.
         */
        blurHorizontalWidth: number;

        /**
         * The vertical width of the blur.
         */
        blurVerticalWidth: number;

        /**
         * The blur texture ratio.
         */
        blurTextureRatio: number;
    };
}

/**
 * V1 Directional Blur Deserializer.
 * @param smartFilter - The SmartFilter to deserialize the block into
 * @param serializedBlock - The serialized block data
 * @returns A deserialized DirectionalBlurBlock
 */
export function directionalBlurDeserializer(
    smartFilter: SmartFilter,
    serializedBlock: ISerializedDirectionalBlurBlockV1
) {
    const block = new DirectionalBlurBlock(smartFilter, serializedBlock.name);

    // If data is missing, use the default value set by the block
    block.blurHorizontalWidth = serializedBlock.data.blurHorizontalWidth ?? block.blurHorizontalWidth;
    block.blurVerticalWidth = serializedBlock.data.blurVerticalWidth ?? block.blurVerticalWidth;
    block.blurTextureRatio = serializedBlock.data.blurTextureRatio ?? block.blurTextureRatio;
    return block;
}
