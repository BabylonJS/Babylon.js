/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./image.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./image.pure";

import { RegisterImage } from "./image.pure";
RegisterImage();
