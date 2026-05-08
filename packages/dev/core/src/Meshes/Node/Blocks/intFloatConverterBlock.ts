/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import intFloatConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./intFloatConverterBlock.pure";

import { registerIntFloatConverterBlock } from "./intFloatConverterBlock.pure";
registerIntFloatConverterBlock();
