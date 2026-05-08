/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSetSoundVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetSoundVolumeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphSetSoundVolumeBlock } from "./flowGraphSetSoundVolumeBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.AudioSetVolume, FlowGraphSetSoundVolumeBlock);
