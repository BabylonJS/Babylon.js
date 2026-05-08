/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import prePassOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./prePassOutputBlock.pure";

import { registerPrePassOutputBlock } from "./prePassOutputBlock.pure";
registerPrePassOutputBlock();
