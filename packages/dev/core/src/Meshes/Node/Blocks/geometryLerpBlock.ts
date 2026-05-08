/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryLerpBlock.pure";

import { registerGeometryLerpBlock } from "./geometryLerpBlock.pure";
registerGeometryLerpBlock();
