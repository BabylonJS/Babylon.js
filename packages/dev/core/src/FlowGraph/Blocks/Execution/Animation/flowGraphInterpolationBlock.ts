/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphInterpolationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphInterpolationBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphInterpolationBlock } from "./flowGraphInterpolationBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.ValueInterpolation, FlowGraphInterpolationBlock);
