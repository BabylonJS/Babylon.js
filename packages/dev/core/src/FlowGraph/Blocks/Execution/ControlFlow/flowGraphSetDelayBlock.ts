/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSetDelayBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetDelayBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphSetDelayBlock } from "./flowGraphSetDelayBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.SetDelay, FlowGraphSetDelayBlock);
