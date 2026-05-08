/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cloudBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cloudBlock.pure";

import { registerCloudBlock } from "./cloudBlock.pure";
registerCloudBlock();
