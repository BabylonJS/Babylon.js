/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import intFloatConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./intFloatConverterBlock.pure";

import { RegisterIntFloatConverterBlock } from "./intFloatConverterBlock.pure";
RegisterIntFloatConverterBlock();
