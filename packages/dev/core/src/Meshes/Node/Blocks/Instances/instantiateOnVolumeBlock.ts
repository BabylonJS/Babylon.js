/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateOnVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateOnVolumeBlock.pure";

import { registerInstantiateOnVolumeBlock } from "./instantiateOnVolumeBlock.pure";
registerInstantiateOnVolumeBlock();
