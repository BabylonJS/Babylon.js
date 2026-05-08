/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphCounterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphCounterBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphCallCounterBlock } from "./flowGraphCounterBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.CallCounter, FlowGraphCallCounterBlock);
