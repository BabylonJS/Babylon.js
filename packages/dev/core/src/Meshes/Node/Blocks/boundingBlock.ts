/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boundingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boundingBlock.pure";

import { RegisterBoundingBlock } from "./boundingBlock.pure";
RegisterBoundingBlock();
