/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphFlipFlopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphFlipFlopBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphFlipFlopBlock } from "./flowGraphFlipFlopBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.FlipFlop, FlowGraphFlipFlopBlock);
