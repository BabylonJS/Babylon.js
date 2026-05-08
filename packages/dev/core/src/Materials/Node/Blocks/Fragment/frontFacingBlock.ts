/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import frontFacingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./frontFacingBlock.pure";

import { RegisterFrontFacingBlock } from "./frontFacingBlock.pure";
RegisterFrontFacingBlock();
