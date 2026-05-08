/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import divideBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./divideBlock.pure";

import { registerDivideBlock } from "./divideBlock.pure";
registerDivideBlock();
