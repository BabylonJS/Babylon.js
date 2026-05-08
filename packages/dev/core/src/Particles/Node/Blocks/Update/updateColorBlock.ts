/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateColorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateColorBlock.pure";

import { registerUpdateColorBlock } from "./updateColorBlock.pure";
registerUpdateColorBlock();
