/**
 * Re-exports the pure implementation and applies runtime side effects.
 * Import meshBlendingPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshBlendingPostProcessBlock.pure";

import { RegisterMeshBlendingPostProcessBlock } from "./meshBlendingPostProcessBlock.pure";
RegisterMeshBlendingPostProcessBlock();
