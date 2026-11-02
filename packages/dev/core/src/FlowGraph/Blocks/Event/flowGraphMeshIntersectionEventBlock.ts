/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMeshIntersectionEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMeshIntersectionEventBlock.pure";

import { RegisterFlowGraphMeshIntersectionEventBlock } from "./flowGraphMeshIntersectionEventBlock.pure";
RegisterFlowGraphMeshIntersectionEventBlock();
