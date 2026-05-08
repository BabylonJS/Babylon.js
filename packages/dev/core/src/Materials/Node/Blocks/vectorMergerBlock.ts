/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vectorMergerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vectorMergerBlock.pure";

import { registerVectorMergerBlock } from "./vectorMergerBlock.pure";
registerVectorMergerBlock();
