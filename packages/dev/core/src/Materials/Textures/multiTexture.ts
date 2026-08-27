/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import multiTexture.pure for tree-shakeable, side-effect-free usage.
 */

export * from "./multiTexture.pure";

import { RegisterMultiTexture } from "./multiTexture.pure";
RegisterMultiTexture();
