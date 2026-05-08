/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSwitchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSwitchBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphSwitchBlock } from "./flowGraphSwitchBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Switch, FlowGraphSwitchBlock);
