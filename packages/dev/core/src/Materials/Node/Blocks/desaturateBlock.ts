/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import desaturateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./desaturateBlock.pure";

import { RegisterDesaturateBlock } from "./desaturateBlock.pure";
RegisterDesaturateBlock();
