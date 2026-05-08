/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSoundEndedEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSoundEndedEventBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphSoundEndedEventBlock } from "./flowGraphSoundEndedEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.AudioSoundEndedEvent, FlowGraphSoundEndedEventBlock);
