/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import highlightLayerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./highlightLayerBlock.pure";

import { registerHighlightLayerBlock } from "./highlightLayerBlock.pure";
registerHighlightLayerBlock();
