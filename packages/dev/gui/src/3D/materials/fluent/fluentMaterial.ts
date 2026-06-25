/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./fluentMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./fluentMaterial.pure";

import "./shaders/fluent.vertex";
import "./shaders/fluent.fragment";

import { RegisterFluentMaterial } from "./fluentMaterial.pure";
RegisterFluentMaterial();
