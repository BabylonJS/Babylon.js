/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPointerUpEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerUpEventBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphPointerUpEventBlock } from "./flowGraphPointerUpEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PointerUpEvent, FlowGraphPointerUpEventBlock);
