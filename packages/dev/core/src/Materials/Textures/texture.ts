/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import texture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./texture.pure";

import { registerTexture } from "./texture.pure";
registerTexture();
