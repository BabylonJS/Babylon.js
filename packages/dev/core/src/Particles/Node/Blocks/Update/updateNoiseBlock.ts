/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateNoiseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateNoiseBlock.pure";

import { registerUpdateNoiseBlock } from "./updateNoiseBlock.pure";
registerUpdateNoiseBlock();
