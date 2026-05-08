/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPlaySoundBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPlaySoundBlock.pure";

import { registerFlowGraphPlaySoundBlock } from "./flowGraphPlaySoundBlock.pure";
registerFlowGraphPlaySoundBlock();
