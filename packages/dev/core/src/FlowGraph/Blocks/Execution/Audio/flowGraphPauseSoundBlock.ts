/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPauseSoundBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPauseSoundBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphPauseSoundBlock } from "./flowGraphPauseSoundBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.AudioPauseSound, FlowGraphPauseSoundBlock);
