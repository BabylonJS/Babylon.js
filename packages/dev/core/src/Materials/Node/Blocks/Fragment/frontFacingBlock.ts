/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import frontFacingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./frontFacingBlock.pure";

import { registerFrontFacingBlock } from "./frontFacingBlock.pure";
registerFrontFacingBlock();
