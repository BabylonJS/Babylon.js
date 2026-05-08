/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetPropertyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetPropertyBlock.pure";

import { registerFlowGraphSetPropertyBlock } from "./flowGraphSetPropertyBlock.pure";
registerFlowGraphSetPropertyBlock();
