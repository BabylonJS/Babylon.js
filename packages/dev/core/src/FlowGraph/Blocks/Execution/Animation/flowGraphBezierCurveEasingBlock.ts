/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphBezierCurveEasingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphBezierCurveEasingBlock.pure";

import { registerFlowGraphBezierCurveEasingBlock } from "./flowGraphBezierCurveEasingBlock.pure";
registerFlowGraphBezierCurveEasingBlock();
