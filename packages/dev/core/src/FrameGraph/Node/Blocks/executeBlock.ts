/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import executeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./executeBlock.pure";

import { RegisterExecuteBlock } from "./executeBlock.pure";
RegisterExecuteBlock();
