/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateColorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateColorBlock.pure";

import { RegisterUpdateColorBlock } from "./updateColorBlock.pure";
RegisterUpdateColorBlock();
