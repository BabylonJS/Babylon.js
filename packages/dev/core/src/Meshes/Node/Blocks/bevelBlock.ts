/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import bevelBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bevelBlock.pure";

import { registerBevelBlock } from "./bevelBlock.pure";
registerBevelBlock();
