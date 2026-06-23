/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./mrdlSliderBarMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./mrdlSliderBarMaterial.pure";

import "./shaders/mrdlSliderBar.fragment";
import "./shaders/mrdlSliderBar.vertex";

import { RegisterMRDLSliderBarMaterial } from "./mrdlSliderBarMaterial.pure";
RegisterMRDLSliderBarMaterial();
