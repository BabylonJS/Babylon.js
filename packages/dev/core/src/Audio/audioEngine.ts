/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import audioEngine.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./audioEngine.pure";

import { RegisterAudioEngine } from "./audioEngine.pure";
RegisterAudioEngine();
