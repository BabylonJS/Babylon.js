/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphWaitAllBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphWaitAllBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphWaitAllBlock } from "./flowGraphWaitAllBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.WaitAll, FlowGraphWaitAllBlock);
