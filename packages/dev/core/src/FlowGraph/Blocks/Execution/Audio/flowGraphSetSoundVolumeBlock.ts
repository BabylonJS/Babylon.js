/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetSoundVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetSoundVolumeBlock.pure";

import { registerFlowGraphSetSoundVolumeBlock } from "./flowGraphSetSoundVolumeBlock.pure";
registerFlowGraphSetSoundVolumeBlock();
