/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetSoundVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetSoundVolumeBlock.pure";

import { registerFlowGraphGetSoundVolumeBlock } from "./flowGraphGetSoundVolumeBlock.pure";
registerFlowGraphGetSoundVolumeBlock();
