/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import transformBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./transformBlock.pure";

import { RegisterTransformBlock } from "./transformBlock.pure";
RegisterTransformBlock();
