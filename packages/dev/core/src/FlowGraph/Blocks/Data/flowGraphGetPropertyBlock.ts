/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphGetPropertyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetPropertyBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphGetPropertyBlock } from "./flowGraphGetPropertyBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.GetProperty, FlowGraphGetPropertyBlock);
