/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./slider.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./slider.pure";

import { RegisterSlider } from "./slider.pure";
RegisterSlider();
