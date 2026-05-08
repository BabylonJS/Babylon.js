/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import circleOfConfusionPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./circleOfConfusionPostProcessBlock.pure";

import { registerCircleOfConfusionPostProcessBlock } from "./circleOfConfusionPostProcessBlock.pure";
registerCircleOfConfusionPostProcessBlock();
