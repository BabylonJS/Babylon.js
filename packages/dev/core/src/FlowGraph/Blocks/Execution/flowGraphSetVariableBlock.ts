/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSetVariableBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetVariableBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphSetVariableBlock } from "./flowGraphSetVariableBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.SetVariable, FlowGraphSetVariableBlock);
