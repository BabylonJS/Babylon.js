/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rotationYBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationYBlock.pure";

import { registerRotationYBlock } from "./rotationYBlock.pure";
registerRotationYBlock();
