/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setColorsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setColorsBlock.pure";

import { registerSetColorsBlock } from "./setColorsBlock.pure";
registerSetColorsBlock();
