/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshShapeBlock.pure";

import { RegisterMeshShapeBlock } from "./meshShapeBlock.pure";
RegisterMeshShapeBlock();
