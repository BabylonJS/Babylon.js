/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetPropertyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetPropertyBlock.pure";

import { RegisterFlowGraphSetPropertyBlock } from "./flowGraphSetPropertyBlock.pure";
RegisterFlowGraphSetPropertyBlock();
