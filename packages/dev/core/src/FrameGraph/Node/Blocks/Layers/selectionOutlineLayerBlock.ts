/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import selectionOutlineLayerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./selectionOutlineLayerBlock.pure";

import { RegisterSelectionOutlineLayerBlock } from "./selectionOutlineLayerBlock.pure";
RegisterSelectionOutlineLayerBlock();
