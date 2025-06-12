import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { Nullable } from "@babylonjs/core/types";
import type { BaseBlock, SmartFilter } from "@babylonjs/smart-filters";
import type { IBlockRegistration } from "@babylonjs/smart-filters-blocks";

/**
 * All of the configuration needed for the editor to work with a set of blocks.
 */
export type BlockEditorRegistration = {
    /**
     * Some blocks must appear only once in the graph (e.g. OutputBlock) - this function returns true if the block
     * should be unique in the graph.
     * @param block - The block to check
     * @returns true if the block should be unique in the graph
     */
    getIsUniqueBlock: (block: BaseBlock) => boolean;

    /**
     * Given a block's type and namespace, this function should return a new instance of that block with default values,
     * or null if the block name is not recognized.
     * @param blockType - The type of the block to create
     * @param namespace - The namespace of the block to create
     * @param smartFilter - The Smart Filter to create the block for
     * @param engine - The engine to use for creating blocks
     * @returns A new instance of the block, or null if the block name is not recognized
     */
    getBlock(
        blockType: string,
        namespace: Nullable<string>,
        smartFilter: SmartFilter,
        engine: ThinEngine
    ): Promise<Nullable<BaseBlock>>;

    /**
     * An object that contains all of the blocks to display, organized by category.
     */
    allBlocks: { [key: string]: IBlockRegistration[] };

    /**
     * Optional override of the InputDisplayManager to provide custom display for particular blocks if desired.
     */
    inputDisplayManager?: any;
};
