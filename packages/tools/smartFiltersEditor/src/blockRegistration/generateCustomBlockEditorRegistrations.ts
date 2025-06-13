import type { CustomBlockManager } from "../customBlockManager";
import type { SerializedBlockDefinition, SmartFilter, SmartFilterDeserializer } from "@babylonjs/smart-filters";
import type { IBlockRegistration } from "@babylonjs/smart-filters-blocks";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { CustomBlocksNamespace } from "@babylonjs/smart-filters-editor-control";

/**
 * Generates the block registrations for custom blocks.
 * @param customBlockManager - The custom block manager.
 * @param smartFilterDeserializer - The Smart Filter deserializer.
 * @param customBlockDefinitions - The custom block definitions.
 * @returns - The block registrations.
 */
export function generateCustomBlockRegistrations(
    customBlockManager: CustomBlockManager,
    smartFilterDeserializer: SmartFilterDeserializer,
    customBlockDefinitions: SerializedBlockDefinition[]
): IBlockRegistration[] {
    const blockRegistrations: IBlockRegistration[] = [];

    if (customBlockDefinitions.length > 0) {
        for (const customBlockDefinition of customBlockDefinitions) {
            blockRegistrations.push(
                createBlockRegistration(customBlockManager, customBlockDefinition, smartFilterDeserializer)
            );
        }
    }

    return blockRegistrations;
}

/**
 * Creates a block registration for a custom block
 * @param customBlockManager - The custom block manager.
 * @param blockDefinition - The serialized block definition.
 * @param deserializer - The Smart Filter deserializer.
 * @returns - The block registration.
 */
export function createBlockRegistration(
    customBlockManager: CustomBlockManager,
    blockDefinition: SerializedBlockDefinition,
    deserializer: SmartFilterDeserializer
): IBlockRegistration {
    return {
        blockType: blockDefinition.blockType,
        namespace: blockDefinition.namespace || CustomBlocksNamespace,
        factory: (smartFilter: SmartFilter, engine: ThinEngine) => {
            return customBlockManager.createBlockFromBlockDefinition(
                smartFilter,
                engine,
                blockDefinition,
                null, // use default name
                deserializer
            );
        },
        tooltip: blockDefinition.blockType,
        isCustom: true,
    };
}
