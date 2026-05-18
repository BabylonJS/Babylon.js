/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshAttributeExistsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshAttributeExistsBlock.pure";

import { RegisterMeshAttributeExistsBlock } from "./meshAttributeExistsBlock.pure";
RegisterMeshAttributeExistsBlock();
