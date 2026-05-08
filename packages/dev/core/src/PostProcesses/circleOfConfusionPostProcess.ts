/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import circleOfConfusionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./circleOfConfusionPostProcess.pure";

import { registerCircleOfConfusionPostProcess } from "./circleOfConfusionPostProcess.pure";
registerCircleOfConfusionPostProcess();
