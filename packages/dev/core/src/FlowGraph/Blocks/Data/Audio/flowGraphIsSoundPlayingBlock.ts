/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphIsSoundPlayingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphIsSoundPlayingBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphIsSoundPlayingBlock } from "./flowGraphIsSoundPlayingBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.AudioIsSoundPlaying, FlowGraphIsSoundPlayingBlock);
