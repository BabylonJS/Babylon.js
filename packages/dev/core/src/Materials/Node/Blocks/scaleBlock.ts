/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import scaleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scaleBlock.pure";

import { registerScaleBlock } from "./scaleBlock.pure";
registerScaleBlock();
