/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import smoothStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./smoothStepBlock.pure";

import { registerSmoothStepBlock } from "./smoothStepBlock.pure";
registerSmoothStepBlock();
