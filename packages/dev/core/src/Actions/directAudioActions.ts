/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import directAudioActions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directAudioActions.pure";

import { RegisterDirectAudioActions } from "./directAudioActions.pure";
RegisterDirectAudioActions();
