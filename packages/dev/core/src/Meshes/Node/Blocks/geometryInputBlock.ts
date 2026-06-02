/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryInputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryInputBlock.pure";

import { RegisterGeometryInputBlock } from "./geometryInputBlock.pure";
RegisterGeometryInputBlock();
