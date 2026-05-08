/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetPropertyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetPropertyBlock.pure";

import { registerFlowGraphGetPropertyBlock } from "./flowGraphGetPropertyBlock.pure";
registerFlowGraphGetPropertyBlock();
