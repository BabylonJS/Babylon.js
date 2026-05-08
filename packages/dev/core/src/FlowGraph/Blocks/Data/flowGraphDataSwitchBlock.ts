/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphDataSwitchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDataSwitchBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphDataSwitchBlock } from "./flowGraphDataSwitchBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.DataSwitch, FlowGraphDataSwitchBlock);
