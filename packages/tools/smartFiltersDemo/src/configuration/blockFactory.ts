/* eslint-disable @typescript-eslint/naming-convention */
import type { IBlockRegistration } from "@babylonjs/smart-filters-blocks";
import type { SmartFilter, ISerializedBlockV1, BaseBlock, SmartFilterDeserializer } from "@babylonjs/smart-filters";
import type { Nullable } from "@babylonjs/core/types";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";

/**
 * Creates instances of blocks upon request
 * @param smartFilter - The SmartFilter the block will belong to
 * @param engine - The ThinEngine to use
 * @param serializedBlock - The serialized block to create
 * @param smartFilterDeserializer - The deserializer to use
 * @param builtInBlockRegistrations - The built-in block editor registrations
 * @returns The created block or null if the block type is not recognized
 */
export async function blockFactory(
    smartFilter: SmartFilter,
    engine: ThinEngine,
    serializedBlock: ISerializedBlockV1,
    smartFilterDeserializer: SmartFilterDeserializer,
    builtInBlockRegistrations: IBlockRegistration[]
): Promise<Nullable<BaseBlock>> {
    let newBlock: Nullable<BaseBlock> = null;

    const registration = builtInBlockRegistrations.find(
        (registration) => registration.blockType === serializedBlock.blockType
    );
    if (registration && registration.factory) {
        newBlock = await registration.factory(smartFilter, engine, smartFilterDeserializer, serializedBlock);
    }

    return newBlock;
}
