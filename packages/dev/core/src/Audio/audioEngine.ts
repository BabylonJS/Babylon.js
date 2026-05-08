/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import audioEngine.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./audioEngine.pure";

import { registerAudioEngine } from "./audioEngine.pure";
registerAudioEngine();
