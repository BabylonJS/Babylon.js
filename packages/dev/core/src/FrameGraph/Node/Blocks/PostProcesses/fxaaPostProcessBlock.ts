/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fxaaPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fxaaPostProcessBlock.pure";

import { registerFxaaPostProcessBlock } from "./fxaaPostProcessBlock.pure";
registerFxaaPostProcessBlock();
