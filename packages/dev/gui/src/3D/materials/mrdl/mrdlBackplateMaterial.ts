/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./mrdlBackplateMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./mrdlBackplateMaterial.pure";

import "./shaders/mrdlBackplate.fragment";
import "./shaders/mrdlBackplate.vertex";

import { RegisterMRDLBackplateMaterial } from "./mrdlBackplateMaterial.pure";
RegisterMRDLBackplateMaterial();
