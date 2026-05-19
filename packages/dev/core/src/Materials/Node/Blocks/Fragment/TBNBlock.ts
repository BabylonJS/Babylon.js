/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import TBNBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./TBNBlock.pure";

import { RegisterTBNBlock } from "./TBNBlock.pure";
RegisterTBNBlock();
