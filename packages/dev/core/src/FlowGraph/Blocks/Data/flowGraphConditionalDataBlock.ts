/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphConditionalDataBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphConditionalDataBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphConditionalDataBlock } from "./flowGraphConditionalDataBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Conditional, FlowGraphConditionalDataBlock);
