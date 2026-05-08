/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setNormalsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setNormalsBlock.pure";

import { RegisterSetNormalsBlock } from "./setNormalsBlock.pure";
RegisterSetNormalsBlock();
