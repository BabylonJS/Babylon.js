/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import directAudioActions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directAudioActions.pure";

import { registerDirectAudioActions } from "./directAudioActions.pure";
registerDirectAudioActions();
