/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lengthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lengthBlock.pure";

import { RegisterLengthBlock } from "./lengthBlock.pure";
RegisterLengthBlock();
