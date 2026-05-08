/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import randomBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./randomBlock.pure";

import { RegisterRandomBlock } from "./randomBlock.pure";
RegisterRandomBlock();
