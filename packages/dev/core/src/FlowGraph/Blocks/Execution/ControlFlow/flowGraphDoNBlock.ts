/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphDoNBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDoNBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphDoNBlock } from "./flowGraphDoNBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.DoN, FlowGraphDoNBlock);
