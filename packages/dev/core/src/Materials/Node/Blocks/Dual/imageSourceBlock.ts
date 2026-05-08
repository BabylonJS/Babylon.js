/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import imageSourceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageSourceBlock.pure";

import { RegisterImageSourceBlock } from "./imageSourceBlock.pure";
RegisterImageSourceBlock();
