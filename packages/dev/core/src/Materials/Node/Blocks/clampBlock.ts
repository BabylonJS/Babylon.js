/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clampBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clampBlock.pure";

import { RegisterClampBlock } from "./clampBlock.pure";
RegisterClampBlock();
