/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPointerMoveEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerMoveEventBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphPointerMoveEventBlock } from "./flowGraphPointerMoveEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PointerMoveEvent, FlowGraphPointerMoveEventBlock);
