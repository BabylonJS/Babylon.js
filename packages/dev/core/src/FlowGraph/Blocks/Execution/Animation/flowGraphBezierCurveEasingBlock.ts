/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphBezierCurveEasingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphBezierCurveEasingBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphBezierCurveEasingBlock } from "./flowGraphBezierCurveEasingBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.BezierCurveEasing, FlowGraphBezierCurveEasingBlock);
