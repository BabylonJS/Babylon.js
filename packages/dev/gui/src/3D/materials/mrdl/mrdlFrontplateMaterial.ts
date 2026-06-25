/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./mrdlFrontplateMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./mrdlFrontplateMaterial.pure";

import "./shaders/mrdlFrontplate.fragment";
import "./shaders/mrdlFrontplate.vertex";

import { RegisterMRDLFrontplateMaterial } from "./mrdlFrontplateMaterial.pure";
RegisterMRDLFrontplateMaterial();
