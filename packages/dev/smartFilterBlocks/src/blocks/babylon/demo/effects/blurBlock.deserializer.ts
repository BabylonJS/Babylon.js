import { type SmartFilter, type ISerializedBlockV1 } from "@babylonjs/smart-filters";
import { BlurBlock } from "./blurBlock.js";

/**
 * The definition of the extra data serialized for blur blocks.
 */
export interface ISerializedBlurBlockV1 extends ISerializedBlockV1 {
    /**
     * The extra data of the block.
     */
    data: {
        /**
         * The blur texture ratio per pass.
         */
        blurTextureRatioPerPass: number;

        /**
         * The size of the blur.
         */
        blurSize: number;
    };
}

/**
 * V1 Blur Deserializer.
 * @param smartFilter - The SmartFilter to deserialize the block into
 * @param serializedBlock - The serialized block data
 * @returns A deserialized BlurBlock
 */
export function blurBlockDeserializer(smartFilter: SmartFilter, serializedBlock: ISerializedBlurBlockV1) {
    const block = new BlurBlock(smartFilter, serializedBlock.name);

    // If data is missing, use the default value set by the block
    block.blurTextureRatioPerPass = serializedBlock.data.blurTextureRatioPerPass ?? block.blurSize;
    block.blurSize = serializedBlock.data.blurSize ?? block.blurSize;
    return block;
}
