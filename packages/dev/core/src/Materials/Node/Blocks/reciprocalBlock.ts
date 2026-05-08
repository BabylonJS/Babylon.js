/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reciprocalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reciprocalBlock.pure";

import { registerReciprocalBlock } from "./reciprocalBlock.pure";
registerReciprocalBlock();
