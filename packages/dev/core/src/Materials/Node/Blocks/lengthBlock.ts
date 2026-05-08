/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lengthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lengthBlock.pure";

import { registerLengthBlock } from "./lengthBlock.pure";
registerLengthBlock();
