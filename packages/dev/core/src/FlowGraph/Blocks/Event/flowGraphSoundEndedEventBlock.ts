/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSoundEndedEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSoundEndedEventBlock.pure";

import { RegisterFlowGraphSoundEndedEventBlock } from "./flowGraphSoundEndedEventBlock.pure";
RegisterFlowGraphSoundEndedEventBlock();
