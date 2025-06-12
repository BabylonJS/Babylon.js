import type { SmartFilter, ISerializedBlockV1, BaseBlock } from "@babylonjs/smart-filters";
import type { Nullable } from "@babylonjs/core/types";
import { WebCamInputBlockName } from "./blockNames.js";

/**
 * Custom input block deserializer to provide special behavior for input blocks in this library.
 *
 * @param smartFilter - The smart filter to create the block for
 * @param serializedBlock - The serialized block to create
 * @returns - The instantiated block, or null if the block type is not registered
 */
export async function inputBlockDeserializer(
    smartFilter: SmartFilter,
    serializedBlock: ISerializedBlockV1
): Promise<Nullable<BaseBlock>> {
    if (serializedBlock.name === WebCamInputBlockName) {
        const module = await import(/* webpackChunkName: "webCamBlock" */ "./webCamInputBlock/webCamInputBlock.js");
        return new module.WebCamInputBlock(smartFilter);
    }
    return null;
}
