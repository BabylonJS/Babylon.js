/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphDebugBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDebugBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphDebugBlock } from "./flowGraphDebugBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.DebugBlock, FlowGraphDebugBlock);
