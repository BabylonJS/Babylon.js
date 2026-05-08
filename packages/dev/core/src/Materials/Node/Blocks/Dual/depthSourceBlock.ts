/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthSourceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthSourceBlock.pure";

import { registerDepthSourceBlock } from "./depthSourceBlock.pure";
registerDepthSourceBlock();
