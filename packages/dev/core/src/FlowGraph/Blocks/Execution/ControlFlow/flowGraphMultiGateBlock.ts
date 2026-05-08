/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphMultiGateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMultiGateBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphMultiGateBlock } from "./flowGraphMultiGateBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.MultiGate, FlowGraphMultiGateBlock);
