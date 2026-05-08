/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshAttributeExistsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshAttributeExistsBlock.pure";

import { registerMeshAttributeExistsBlock } from "./meshAttributeExistsBlock.pure";
registerMeshAttributeExistsBlock();
