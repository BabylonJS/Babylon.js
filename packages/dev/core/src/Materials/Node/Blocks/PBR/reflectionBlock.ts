/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionBlock.pure";

import { registerReflectionBlock } from "./reflectionBlock.pure";
registerReflectionBlock();
