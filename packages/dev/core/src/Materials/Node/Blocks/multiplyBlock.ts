/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import multiplyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./multiplyBlock.pure";

import { registerMultiplyBlock } from "./multiplyBlock.pure";
registerMultiplyBlock();
