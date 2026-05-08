/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphForLoopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphForLoopBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphForLoopBlock } from "./flowGraphForLoopBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.ForLoop, FlowGraphForLoopBlock);
