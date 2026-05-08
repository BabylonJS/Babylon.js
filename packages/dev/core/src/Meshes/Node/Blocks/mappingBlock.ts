/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mappingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mappingBlock.pure";

import { registerMappingBlock } from "./mappingBlock.pure";
registerMappingBlock();
