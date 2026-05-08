/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sound.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sound.pure";

import { registerSound } from "./sound.pure";
registerSound();
