/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphThrottleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphThrottleBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphThrottleBlock } from "./flowGraphThrottleBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Throttle, FlowGraphThrottleBlock);
