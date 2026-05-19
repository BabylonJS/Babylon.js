/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import powBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./powBlock.pure";

import { RegisterPowBlock } from "./powBlock.pure";
RegisterPowBlock();
