/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectBlock.pure";

import { registerReflectBlock } from "./reflectBlock.pure";
registerReflectBlock();
