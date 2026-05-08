/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPointerOutEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerOutEventBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphPointerOutEventBlock } from "./flowGraphPointerOutEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PointerOutEvent, FlowGraphPointerOutEventBlock);
