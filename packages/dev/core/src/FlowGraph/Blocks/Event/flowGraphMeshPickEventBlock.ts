/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMeshPickEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMeshPickEventBlock.pure";

import { registerFlowGraphMeshPickEventBlock } from "./flowGraphMeshPickEventBlock.pure";
registerFlowGraphMeshPickEventBlock();
