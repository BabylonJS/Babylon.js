/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryCrossBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryCrossBlock.pure";

import { registerGeometryCrossBlock } from "./geometryCrossBlock.pure";
registerGeometryCrossBlock();
