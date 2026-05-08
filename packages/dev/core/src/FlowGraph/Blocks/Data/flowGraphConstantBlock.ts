/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphConstantBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphConstantBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphConstantBlock } from "./flowGraphConstantBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Constant, FlowGraphConstantBlock);
