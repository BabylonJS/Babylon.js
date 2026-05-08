/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rotate2dBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotate2dBlock.pure";

import { registerRotate2dBlock } from "./rotate2dBlock.pure";
registerRotate2dBlock();
