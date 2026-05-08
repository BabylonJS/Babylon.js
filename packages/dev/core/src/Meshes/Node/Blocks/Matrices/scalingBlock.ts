/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import scalingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scalingBlock.pure";

import { registerScalingBlock } from "./scalingBlock.pure";
registerScalingBlock();
