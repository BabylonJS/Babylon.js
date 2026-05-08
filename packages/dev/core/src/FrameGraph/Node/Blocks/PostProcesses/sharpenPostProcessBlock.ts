/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sharpenPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sharpenPostProcessBlock.pure";

import { registerSharpenPostProcessBlock } from "./sharpenPostProcessBlock.pure";
registerSharpenPostProcessBlock();
