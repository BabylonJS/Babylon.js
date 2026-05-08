/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import computeNormalsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeNormalsBlock.pure";

import { RegisterComputeNormalsBlock } from "./computeNormalsBlock.pure";
RegisterComputeNormalsBlock();
