/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import simplexPerlin3DBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./simplexPerlin3DBlock.pure";

import { registerSimplexPerlin3DBlock } from "./simplexPerlin3DBlock.pure";
registerSimplexPerlin3DBlock();
