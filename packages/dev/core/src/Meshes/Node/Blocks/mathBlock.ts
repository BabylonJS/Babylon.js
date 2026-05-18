/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mathBlock.pure";

import { RegisterMathBlock } from "./mathBlock.pure";
RegisterMathBlock();
