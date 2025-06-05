import { InputBlock } from "./inputBlock.js";
import type { SerializedInputBlockData } from "./inputBlock.serialization.types.js";
import { ConnectionPointType } from "../connection/connectionPointType.js";
import type { SmartFilter } from "../smartFilter.js";
import type { ISerializedBlockV1 } from "../serialization/v1/smartFilterSerialization.types.js";

/**
 * V1 Input Block Deserializer
 * @param smartFilter - The SmartFilter to deserialize the block into
 * @param serializedBlock - The serialized block data
 * @returns A deserialized InputBlock
 */
export function inputBlockDeserializer(smartFilter: SmartFilter, serializedBlock: ISerializedBlockV1) {
    const blockData = serializedBlock.data as SerializedInputBlockData;
    let inputBlock;

    switch (blockData.inputType) {
        case ConnectionPointType.Boolean:
            {
                inputBlock = new InputBlock(
                    smartFilter,
                    serializedBlock.name,
                    ConnectionPointType.Boolean,
                    blockData.value
                );
            }
            break;
        case ConnectionPointType.Float:
            {
                inputBlock = new InputBlock(
                    smartFilter,
                    serializedBlock.name,
                    ConnectionPointType.Float,
                    blockData.value
                );
                inputBlock.editorData = {
                    animationType: blockData.animationType,
                    valueDeltaPerMs: blockData.valueDeltaPerMs,
                    min: blockData.min,
                    max: blockData.max,
                };
            }
            break;
        case ConnectionPointType.Texture:
            {
                // Create the input block
                inputBlock = new InputBlock(smartFilter, serializedBlock.name, ConnectionPointType.Texture, null);

                // If editor data was serialized, set it on the deserialized block
                inputBlock.editorData = {
                    url: blockData.url,
                    urlTypeHint: blockData.urlTypeHint,
                    anisotropicFilteringLevel: blockData.anisotropicFilteringLevel,
                    flipY: blockData.flipY,
                    forcedExtension: blockData.forcedExtension,
                };
            }
            break;
        case ConnectionPointType.Color3:
            {
                inputBlock = new InputBlock(
                    smartFilter,
                    serializedBlock.name,
                    ConnectionPointType.Color3,
                    blockData.value
                );
            }
            break;
        case ConnectionPointType.Color4:
            {
                inputBlock = new InputBlock(
                    smartFilter,
                    serializedBlock.name,
                    ConnectionPointType.Color4,
                    blockData.value
                );
            }
            break;
        case ConnectionPointType.Vector2:
            {
                inputBlock = new InputBlock(
                    smartFilter,
                    serializedBlock.name,
                    ConnectionPointType.Vector2,
                    blockData.value
                );
            }
            break;
    }
    if (inputBlock) {
        inputBlock.appMetadata = blockData.appMetadata;

        return inputBlock;
    }

    throw new Error("Could not deserialize input block, unknown input type");
}
