/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphReceiveCustomEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphReceiveCustomEventBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphReceiveCustomEventBlock } from "./flowGraphReceiveCustomEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.ReceiveCustomEvent, FlowGraphReceiveCustomEventBlock);
