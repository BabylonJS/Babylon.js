/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSequenceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSequenceBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphSequenceBlock } from "./flowGraphSequenceBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Sequence, FlowGraphSequenceBlock);
