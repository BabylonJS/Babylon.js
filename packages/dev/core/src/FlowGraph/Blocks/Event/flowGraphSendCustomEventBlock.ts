/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSendCustomEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSendCustomEventBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphSendCustomEventBlock } from "./flowGraphSendCustomEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.SendCustomEvent, FlowGraphSendCustomEventBlock);
