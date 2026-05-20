/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import videoTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./videoTexture.pure";

import { RegisterVideoTexture } from "./videoTexture.pure";
RegisterVideoTexture();
