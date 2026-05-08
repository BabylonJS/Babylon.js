/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphWhileLoopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphWhileLoopBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphWhileLoopBlock } from "./flowGraphWhileLoopBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.WhileLoop, FlowGraphWhileLoopBlock);
