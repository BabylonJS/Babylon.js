/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateOnVerticesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateOnVerticesBlock.pure";

import { registerInstantiateOnVerticesBlock } from "./instantiateOnVerticesBlock.pure";
registerInstantiateOnVerticesBlock();
