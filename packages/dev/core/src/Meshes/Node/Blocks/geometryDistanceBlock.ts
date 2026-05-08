/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryDistanceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryDistanceBlock.pure";

import { registerGeometryDistanceBlock } from "./geometryDistanceBlock.pure";
registerGeometryDistanceBlock();
