/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setNormalsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setNormalsBlock.pure";

import { registerSetNormalsBlock } from "./setNormalsBlock.pure";
registerSetNormalsBlock();
