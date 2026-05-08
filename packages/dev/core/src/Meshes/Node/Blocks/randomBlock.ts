/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import randomBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./randomBlock.pure";

import { registerRandomBlock } from "./randomBlock.pure";
registerRandomBlock();
