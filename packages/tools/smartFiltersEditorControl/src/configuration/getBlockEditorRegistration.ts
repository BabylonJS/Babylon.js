import type { ThinEngine } from "core/Engines/thinEngine.js";
import type { Nullable } from "core/types.js";
import { type BaseBlock, type SmartFilter, type SmartFilterDeserializer, Logger } from "smart-filters";
import { inputsNamespace, type IBlockRegistration } from "smart-filters-blocks";
import type { BlockEditorRegistration } from "./blockEditorRegistration";
import { CustomInputDisplayManager } from "./customInputDisplayManager.js";
import { CustomBlocksNamespace, OutputBlockName } from "./constants.js";

/**
 * Creates the block editor registration for the editor.
 * @param smartFilterDeserializer - The smart filter deserializer to use
 * @param allBlockRegistrations - All block registrations to use
 * @param includeCustomBlocksCategory - If true, includes the custom blocks category even if there are no blocks in that category
 * @returns The block registration
 */
export function GetBlockEditorRegistration(
    smartFilterDeserializer: SmartFilterDeserializer,
    allBlockRegistrations: IBlockRegistration[],
    includeCustomBlocksCategory: boolean
): BlockEditorRegistration {
    const allBlocks: { [key: string]: IBlockRegistration[] } = {};

    // Include the custom blocks category first if desired
    if (includeCustomBlocksCategory) {
        allBlocks[CustomBlocksNamespace] = [];
    }

    // Next always have the inputs
    allBlocks[inputsNamespace] = [];

    // Create the map of blocks by namespace now in alphabetical order
    const allBlockRegistrationsSortedByNamespace = allBlockRegistrations.sort((a, b) => a.namespace.localeCompare(b.namespace));

    allBlockRegistrationsSortedByNamespace.forEach((registration: IBlockRegistration) => {
        if (allBlocks[registration.namespace]) {
            allBlocks[registration.namespace]!.push(registration);
        } else {
            allBlocks[registration.namespace] = [registration];
        }
    });

    // Create function to call the right factory for a block given the block type and namespace
    const getBlockAsync = async (blockType: string, namespace: Nullable<string>, smartFilter: SmartFilter, engine: ThinEngine): Promise<Nullable<BaseBlock>> => {
        const registration = allBlockRegistrations.find((r) => r.blockType === blockType && r.namespace === namespace);
        if (registration && registration.factory) {
            try {
                return await registration.factory(smartFilter, engine, smartFilterDeserializer);
            } catch (err) {
                const errorString = `Error creating block ${blockType} in namespace ${namespace}:\n ${err}`;
                Logger.Error(errorString);
            }
        }
        return null;
    };

    const blockEditorRegistration: BlockEditorRegistration = {
        getIsUniqueBlock: GetIsUniqueBlock,
        getBlock: getBlockAsync,
        allBlocks,
        inputDisplayManager: CustomInputDisplayManager,
    };

    return blockEditorRegistration;
}

/**
 * Some blocks must appear only once in the graph (e.g. OutputBlock) - this function returns true if the block
 * should be unique in the graph.
 * @param block - The block to check
 * @returns Whether the block should be unique in the graph
 */
function GetIsUniqueBlock(block: BaseBlock): boolean {
    return block.getClassName() === OutputBlockName;
}
