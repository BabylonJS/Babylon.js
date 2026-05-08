/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryOptimizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryOptimizeBlock.pure";

import { registerGeometryOptimizeBlock } from "./geometryOptimizeBlock.pure";
registerGeometryOptimizeBlock();
