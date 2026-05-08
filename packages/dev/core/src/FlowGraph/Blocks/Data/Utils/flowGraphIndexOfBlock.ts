/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphIndexOfBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphIndexOfBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphIndexOfBlock } from "./flowGraphIndexOfBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.IndexOf, FlowGraphIndexOfBlock);
