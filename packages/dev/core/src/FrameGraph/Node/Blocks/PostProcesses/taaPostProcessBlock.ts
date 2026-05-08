/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import taaPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./taaPostProcessBlock.pure";

import { registerTaaPostProcessBlock } from "./taaPostProcessBlock.pure";
registerTaaPostProcessBlock();
