/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphFunctionReferenceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphFunctionReferenceBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphFunctionReferenceBlock } from "./flowGraphFunctionReferenceBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.FunctionReference, FlowGraphFunctionReferenceBlock);
