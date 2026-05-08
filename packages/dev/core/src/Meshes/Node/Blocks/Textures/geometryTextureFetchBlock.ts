/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryTextureFetchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTextureFetchBlock.pure";

import { RegisterGeometryTextureFetchBlock } from "./geometryTextureFetchBlock.pure";
RegisterGeometryTextureFetchBlock();
