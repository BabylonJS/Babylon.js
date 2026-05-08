/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryCollectionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryCollectionBlock.pure";

import { registerGeometryCollectionBlock } from "./geometryCollectionBlock.pure";
registerGeometryCollectionBlock();
