import type { IBlockRegistration } from "@babylonjs/smart-filters-blocks";
import type { BlockEditorRegistration } from "@babylonjs/smart-filters-editor-control";

/**
 * Removes a custom block from the block editor registration.
 * @param blockEditorRegistration - The block editor registration to remove the custom block from
 * @param allBlockRegistrations - The list of all block registrations
 * @param blockType - The type of the block to remove
 * @param namespace - The namespace of the block to remove
 */
export function removeCustomBlockFromBlockEditorRegistration(
    blockEditorRegistration: BlockEditorRegistration,
    allBlockRegistrations: IBlockRegistration[],
    blockType: string,
    namespace: string
) {
    const customBlockList = blockEditorRegistration.allBlocks[namespace];
    if (customBlockList) {
        const index = customBlockList.findIndex((b) => b.blockType === blockType);
        if (index !== -1) {
            customBlockList.splice(index, 1);
        }
    }

    const index = allBlockRegistrations.findIndex((b) => b.blockType === blockType && b.namespace === namespace);
    if (index !== -1) {
        allBlockRegistrations.splice(index, 1);
    }
}
