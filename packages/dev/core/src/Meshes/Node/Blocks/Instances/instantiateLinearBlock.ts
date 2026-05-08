/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateLinearBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateLinearBlock.pure";

import { registerInstantiateLinearBlock } from "./instantiateLinearBlock.pure";
registerInstantiateLinearBlock();
