/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boundingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boundingBlock.pure";

import { registerBoundingBlock } from "./boundingBlock.pure";
registerBoundingBlock();
