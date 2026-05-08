/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nLerpBlock.pure";

import { RegisterNLerpBlock } from "./nLerpBlock.pure";
RegisterNLerpBlock();
