/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vectorConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vectorConverterBlock.pure";

import { registerVectorConverterBlock } from "./vectorConverterBlock.pure";
registerVectorConverterBlock();
