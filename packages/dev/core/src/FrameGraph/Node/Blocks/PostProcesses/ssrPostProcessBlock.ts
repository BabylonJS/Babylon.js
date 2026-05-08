/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssrPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssrPostProcessBlock.pure";

import { registerSsrPostProcessBlock } from "./ssrPostProcessBlock.pure";
registerSsrPostProcessBlock();
