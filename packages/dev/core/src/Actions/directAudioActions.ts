/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import directAudioActions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directAudioActions.pure";

import { RegisterClass } from "../Misc/typeStore";
import { PlaySoundAction, StopSoundAction } from "./directAudioActions.pure";

RegisterClass("BABYLON.PlaySoundAction", PlaySoundAction);
RegisterClass("BABYLON.StopSoundAction", StopSoundAction);
