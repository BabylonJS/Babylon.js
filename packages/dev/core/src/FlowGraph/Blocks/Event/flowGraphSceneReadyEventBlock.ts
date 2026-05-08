/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSceneReadyEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSceneReadyEventBlock.pure";

import { registerFlowGraphSceneReadyEventBlock } from "./flowGraphSceneReadyEventBlock.pure";
registerFlowGraphSceneReadyEventBlock();
