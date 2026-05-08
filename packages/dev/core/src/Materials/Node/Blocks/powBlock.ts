/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import powBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./powBlock.pure";

import { registerPowBlock } from "./powBlock.pure";
registerPowBlock();
