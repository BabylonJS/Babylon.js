/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPointerDownEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerDownEventBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphPointerDownEventBlock } from "./flowGraphPointerDownEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PointerDownEvent, FlowGraphPointerDownEventBlock);
