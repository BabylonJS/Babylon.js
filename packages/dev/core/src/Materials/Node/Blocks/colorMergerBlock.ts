/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorMergerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorMergerBlock.pure";

import { registerColorMergerBlock } from "./colorMergerBlock.pure";
registerColorMergerBlock();
