/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import TBNBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./TBNBlock.pure";

import { registerTBNBlock } from "./TBNBlock.pure";
registerTBNBlock();
