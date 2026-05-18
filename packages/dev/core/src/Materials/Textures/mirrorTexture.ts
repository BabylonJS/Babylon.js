/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mirrorTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mirrorTexture.pure";

import { RegisterMirrorTexture } from "./mirrorTexture.pure";
RegisterMirrorTexture();
