/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenSpaceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceBlock.pure";

import { registerScreenSpaceBlock } from "./screenSpaceBlock.pure";
registerScreenSpaceBlock();
