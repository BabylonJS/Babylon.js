/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSetPropertyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetPropertyBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphSetPropertyBlock } from "./flowGraphSetPropertyBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.SetProperty, FlowGraphSetPropertyBlock);
