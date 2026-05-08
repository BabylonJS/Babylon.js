/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lightInformationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lightInformationBlock.pure";

import { registerLightInformationBlock } from "./lightInformationBlock.pure";
registerLightInformationBlock();
