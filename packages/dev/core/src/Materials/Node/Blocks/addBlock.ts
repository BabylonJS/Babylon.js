/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import addBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./addBlock.pure";

import { registerAddBlock } from "./addBlock.pure";
registerAddBlock();
