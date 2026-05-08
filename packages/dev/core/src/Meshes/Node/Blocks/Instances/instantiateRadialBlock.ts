/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateRadialBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateRadialBlock.pure";

import { registerInstantiateRadialBlock } from "./instantiateRadialBlock.pure";
registerInstantiateRadialBlock();
