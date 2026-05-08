/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import transformBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./transformBlock.pure";

import { registerTransformBlock } from "./transformBlock.pure";
registerTransformBlock();
