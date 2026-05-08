/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import twirlBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./twirlBlock.pure";

import { RegisterTwirlBlock } from "./twirlBlock.pure";
RegisterTwirlBlock();
