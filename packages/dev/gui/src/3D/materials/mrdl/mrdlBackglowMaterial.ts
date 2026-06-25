/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./mrdlBackglowMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./mrdlBackglowMaterial.pure";

import "./shaders/mrdlBackglow.fragment";
import "./shaders/mrdlBackglow.vertex";

import { RegisterMRDLBackglowMaterial } from "./mrdlBackglowMaterial.pure";
RegisterMRDLBackglowMaterial();
