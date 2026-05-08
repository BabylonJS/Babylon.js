/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryPosterizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryPosterizeBlock.pure";

import { RegisterGeometryPosterizeBlock } from "./geometryPosterizeBlock.pure";
RegisterGeometryPosterizeBlock();
