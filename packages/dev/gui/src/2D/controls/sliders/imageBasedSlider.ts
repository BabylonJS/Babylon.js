/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./imageBasedSlider.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./imageBasedSlider.pure";

import { RegisterImageBasedSlider } from "./imageBasedSlider.pure";
RegisterImageBasedSlider();
