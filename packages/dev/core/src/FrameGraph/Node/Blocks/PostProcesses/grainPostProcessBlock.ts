/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import grainPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./grainPostProcessBlock.pure";

import { RegisterGrainPostProcessBlock } from "./grainPostProcessBlock.pure";
RegisterGrainPostProcessBlock();
