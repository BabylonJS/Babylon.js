/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gridBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gridBlock.pure";

import { registerGridBlock } from "./gridBlock.pure";
registerGridBlock();
