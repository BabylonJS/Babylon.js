/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boxBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boxBlock.pure";

import { RegisterBoxBlock } from "./boxBlock.pure";
RegisterBoxBlock();
