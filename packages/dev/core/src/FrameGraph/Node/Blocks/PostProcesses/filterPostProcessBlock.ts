/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import filterPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./filterPostProcessBlock.pure";

import { registerFilterPostProcessBlock } from "./filterPostProcessBlock.pure";
registerFilterPostProcessBlock();
