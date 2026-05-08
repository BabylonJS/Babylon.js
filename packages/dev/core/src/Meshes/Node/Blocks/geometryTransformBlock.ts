/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryTransformBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTransformBlock.pure";

import { registerGeometryTransformBlock } from "./geometryTransformBlock.pure";
registerGeometryTransformBlock();
