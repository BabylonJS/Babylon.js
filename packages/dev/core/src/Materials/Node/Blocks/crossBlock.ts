/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import crossBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./crossBlock.pure";

import { RegisterCrossBlock } from "./crossBlock.pure";
RegisterCrossBlock();
