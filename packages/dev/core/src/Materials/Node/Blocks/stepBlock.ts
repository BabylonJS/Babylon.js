/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stepBlock.pure";

import { RegisterStepBlock } from "./stepBlock.pure";
RegisterStepBlock();
