/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSceneReadyEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSceneReadyEventBlock.pure";

import { RegisterFlowGraphSceneReadyEventBlock } from "./flowGraphSceneReadyEventBlock.pure";
RegisterFlowGraphSceneReadyEventBlock();
