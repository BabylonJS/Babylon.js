/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryDotBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryDotBlock.pure";

import { RegisterGeometryDotBlock } from "./geometryDotBlock.pure";
RegisterGeometryDotBlock();
