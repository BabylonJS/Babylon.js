/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryNLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryNLerpBlock.pure";

import { registerGeometryNLerpBlock } from "./geometryNLerpBlock.pure";
registerGeometryNLerpBlock();
