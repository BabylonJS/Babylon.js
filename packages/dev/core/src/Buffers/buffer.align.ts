export * from "./buffer.align.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import buffer.align.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./buffer.align.pure";

import { registerBufferAlign } from "./buffer.align.pure";
registerBufferAlign();
