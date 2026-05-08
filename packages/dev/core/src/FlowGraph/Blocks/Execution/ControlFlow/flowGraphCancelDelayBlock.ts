/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphCancelDelayBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphCancelDelayBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphCancelDelayBlock } from "./flowGraphCancelDelayBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.CancelDelay, FlowGraphCancelDelayBlock);
