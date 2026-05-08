/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setColorsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setColorsBlock.pure";

import { RegisterSetColorsBlock } from "./setColorsBlock.pure";
RegisterSetColorsBlock();
