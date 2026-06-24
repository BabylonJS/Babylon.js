/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./mrdlSliderThumbMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./mrdlSliderThumbMaterial.pure";

import "./shaders/mrdlSliderThumb.fragment";
import "./shaders/mrdlSliderThumb.vertex";

import { RegisterMRDLSliderThumbMaterial } from "./mrdlSliderThumbMaterial.pure";
RegisterMRDLSliderThumbMaterial();
