/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthOfFieldPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthOfFieldPostProcessBlock.pure";

import { registerDepthOfFieldPostProcessBlock } from "./depthOfFieldPostProcessBlock.pure";
registerDepthOfFieldPostProcessBlock();
