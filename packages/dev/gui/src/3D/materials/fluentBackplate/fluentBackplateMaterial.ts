/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./fluentBackplateMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./fluentBackplateMaterial.pure";

import "./shaders/fluentBackplate.fragment";
import "./shaders/fluentBackplate.vertex";

import { RegisterFluentBackplateMaterial } from "./fluentBackplateMaterial.pure";
RegisterFluentBackplateMaterial();
