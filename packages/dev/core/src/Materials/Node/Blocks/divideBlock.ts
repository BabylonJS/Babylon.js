/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import divideBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./divideBlock.pure";

import { RegisterDivideBlock } from "./divideBlock.pure";
RegisterDivideBlock();
