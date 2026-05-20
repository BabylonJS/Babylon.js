/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import maxBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./maxBlock.pure";

import { RegisterMaxBlock } from "./maxBlock.pure";
RegisterMaxBlock();
