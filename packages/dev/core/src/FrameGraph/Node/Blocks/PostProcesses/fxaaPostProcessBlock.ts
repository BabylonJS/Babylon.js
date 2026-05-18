/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fxaaPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fxaaPostProcessBlock.pure";

import { RegisterFxaaPostProcessBlock } from "./fxaaPostProcessBlock.pure";
RegisterFxaaPostProcessBlock();
