/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import simplexPerlin3DBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./simplexPerlin3DBlock.pure";

import { RegisterSimplexPerlin3DBlock } from "./simplexPerlin3DBlock.pure";
RegisterSimplexPerlin3DBlock();
