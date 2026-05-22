/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTextureBlock.pure";

import { RegisterGeometryTextureBlock } from "./geometryTextureBlock.pure";
RegisterGeometryTextureBlock();
