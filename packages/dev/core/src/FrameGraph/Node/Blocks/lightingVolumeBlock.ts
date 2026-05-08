/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lightingVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lightingVolumeBlock.pure";

import { registerLightingVolumeBlock } from "./lightingVolumeBlock.pure";
registerLightingVolumeBlock();
