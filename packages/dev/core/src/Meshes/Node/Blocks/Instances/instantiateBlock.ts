/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateBlock.pure";

import { RegisterInstantiateBlock } from "./instantiateBlock.pure";
RegisterInstantiateBlock();
