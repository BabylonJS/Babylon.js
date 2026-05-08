/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryCrossBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryCrossBlock.pure";

import { RegisterGeometryCrossBlock } from "./geometryCrossBlock.pure";
RegisterGeometryCrossBlock();
