/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSceneTickEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSceneTickEventBlock.pure";

import { registerFlowGraphSceneTickEventBlock } from "./flowGraphSceneTickEventBlock.pure";
registerFlowGraphSceneTickEventBlock();
