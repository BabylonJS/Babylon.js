/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssao2PostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssao2PostProcessBlock.pure";

import { RegisterSsao2PostProcessBlock } from "./ssao2PostProcessBlock.pure";
RegisterSsao2PostProcessBlock();
