/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mergeGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mergeGeometryBlock.pure";

import { RegisterMergeGeometryBlock } from "./mergeGeometryBlock.pure";
RegisterMergeGeometryBlock();
