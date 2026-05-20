/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryEaseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryEaseBlock.pure";

import { RegisterGeometryEaseBlock } from "./geometryEaseBlock.pure";
RegisterGeometryEaseBlock();
