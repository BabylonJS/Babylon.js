/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vectorConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vectorConverterBlock.pure";

import { RegisterVectorConverterBlock } from "./vectorConverterBlock.pure";
RegisterVectorConverterBlock();
