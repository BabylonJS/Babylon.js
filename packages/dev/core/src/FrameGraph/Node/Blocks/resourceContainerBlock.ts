/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import resourceContainerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./resourceContainerBlock.pure";

import { registerResourceContainerBlock } from "./resourceContainerBlock.pure";
registerResourceContainerBlock();
