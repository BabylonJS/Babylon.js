/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPauseAnimationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPauseAnimationBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphPauseAnimationBlock } from "./flowGraphPauseAnimationBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PauseAnimation, FlowGraphPauseAnimationBlock);
