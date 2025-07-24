import type { IBlockRegistration } from "smart-filters-blocks";
import { CustomBlocksNamespace, type BlockEditorRegistration } from "smart-filters-editor-control";

/**
 * Adds a custom block to the block editor registration.
 * @param blockEditorRegistration - The block editor registration to add the custom block to
 * @param blockRegistration - The block registration to add
 */
export function AddCustomBlockToBlockEditorRegistration(blockEditorRegistration: BlockEditorRegistration, blockRegistration: IBlockRegistration) {
    const namespace = blockRegistration.namespace || CustomBlocksNamespace;
    if (!blockEditorRegistration.allBlocks[namespace]) {
        blockEditorRegistration.allBlocks[namespace] = [];
    }
    blockEditorRegistration.allBlocks[namespace]!.push(blockRegistration);
}
