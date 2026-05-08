/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryTextureFetchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTextureFetchBlock.pure";

import { registerGeometryTextureFetchBlock } from "./geometryTextureFetchBlock.pure";
registerGeometryTextureFetchBlock();
