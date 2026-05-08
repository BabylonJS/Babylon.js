/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryInfoBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryInfoBlock.pure";

import { registerGeometryInfoBlock } from "./geometryInfoBlock.pure";
registerGeometryInfoBlock();
