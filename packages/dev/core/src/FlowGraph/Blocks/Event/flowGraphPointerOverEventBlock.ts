/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPointerOverEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerOverEventBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphPointerOverEventBlock } from "./flowGraphPointerOverEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PointerOverEvent, FlowGraphPointerOverEventBlock);
