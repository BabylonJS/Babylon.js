/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPlaySoundBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPlaySoundBlock.pure";

import { RegisterFlowGraphPlaySoundBlock } from "./flowGraphPlaySoundBlock.pure";
RegisterFlowGraphPlaySoundBlock();
