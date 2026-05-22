/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetSoundVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetSoundVolumeBlock.pure";

import { RegisterFlowGraphSetSoundVolumeBlock } from "./flowGraphSetSoundVolumeBlock.pure";
RegisterFlowGraphSetSoundVolumeBlock();
