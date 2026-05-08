/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updatePositionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updatePositionBlock.pure";

import { registerUpdatePositionBlock } from "./updatePositionBlock.pure";
registerUpdatePositionBlock();
