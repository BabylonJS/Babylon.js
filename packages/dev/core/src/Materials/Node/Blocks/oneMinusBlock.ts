/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import oneMinusBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./oneMinusBlock.pure";

import { RegisterOneMinusBlock } from "./oneMinusBlock.pure";
RegisterOneMinusBlock();
