/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryDesaturateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryDesaturateBlock.pure";

import { registerGeometryDesaturateBlock } from "./geometryDesaturateBlock.pure";
registerGeometryDesaturateBlock();
