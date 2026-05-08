/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mirrorTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mirrorTexture.pure";

import { registerMirrorTexture } from "./mirrorTexture.pure";
registerMirrorTexture();
