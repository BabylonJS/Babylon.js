/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import curveBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./curveBlock.pure";

import { registerCurveBlock } from "./curveBlock.pure";
registerCurveBlock();
