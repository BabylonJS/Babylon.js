/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPlaySoundBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPlaySoundBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphPlaySoundBlock } from "./flowGraphPlaySoundBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.AudioPlaySound, FlowGraphPlaySoundBlock);
