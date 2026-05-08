/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorConverterBlock.pure";

import { registerColorConverterBlock } from "./colorConverterBlock.pure";
registerColorConverterBlock();
