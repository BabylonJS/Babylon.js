/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphStopSoundBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphStopSoundBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphStopSoundBlock } from "./flowGraphStopSoundBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.AudioStopSound, FlowGraphStopSoundBlock);
