/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphStopSoundBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphStopSoundBlock.pure";

import { RegisterFlowGraphStopSoundBlock } from "./flowGraphStopSoundBlock.pure";
RegisterFlowGraphStopSoundBlock();
