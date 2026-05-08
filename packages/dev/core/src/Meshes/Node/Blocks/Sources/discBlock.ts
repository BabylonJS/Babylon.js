/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import discBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./discBlock.pure";

import { registerDiscBlock } from "./discBlock.pure";
registerDiscBlock();
