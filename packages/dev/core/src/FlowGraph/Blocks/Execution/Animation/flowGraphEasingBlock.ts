/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphEasingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphEasingBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphEasingBlock } from "./flowGraphEasingBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Easing, FlowGraphEasingBlock);
