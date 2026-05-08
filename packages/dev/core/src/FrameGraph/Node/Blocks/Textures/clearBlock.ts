/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clearBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clearBlock.pure";

import { registerClearBlock } from "./clearBlock.pure";
registerClearBlock();
