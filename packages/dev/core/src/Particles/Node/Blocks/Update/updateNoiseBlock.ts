/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateNoiseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateNoiseBlock.pure";

import { RegisterUpdateNoiseBlock } from "./updateNoiseBlock.pure";
RegisterUpdateNoiseBlock();
