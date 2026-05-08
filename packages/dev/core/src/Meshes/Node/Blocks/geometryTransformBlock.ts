/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryTransformBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTransformBlock.pure";

import { RegisterGeometryTransformBlock } from "./geometryTransformBlock.pure";
RegisterGeometryTransformBlock();
