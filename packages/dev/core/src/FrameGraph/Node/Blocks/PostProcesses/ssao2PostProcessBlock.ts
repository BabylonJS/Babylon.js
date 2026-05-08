/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssao2PostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssao2PostProcessBlock.pure";

import { registerSsao2PostProcessBlock } from "./ssao2PostProcessBlock.pure";
registerSsao2PostProcessBlock();
