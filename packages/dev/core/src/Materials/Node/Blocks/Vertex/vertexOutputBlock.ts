/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vertexOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vertexOutputBlock.pure";

import { RegisterVertexOutputBlock } from "./vertexOutputBlock.pure";
RegisterVertexOutputBlock();
