/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphGetVariableBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetVariableBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphGetVariableBlock } from "./flowGraphGetVariableBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.GetVariable, FlowGraphGetVariableBlock);
