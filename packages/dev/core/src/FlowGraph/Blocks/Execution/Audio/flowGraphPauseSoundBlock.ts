/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPauseSoundBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPauseSoundBlock.pure";

import { RegisterFlowGraphPauseSoundBlock } from "./flowGraphPauseSoundBlock.pure";
RegisterFlowGraphPauseSoundBlock();
