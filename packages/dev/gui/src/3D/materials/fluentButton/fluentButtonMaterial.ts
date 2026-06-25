/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./fluentButtonMaterial.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./fluentButtonMaterial.pure";

import "./shaders/fluentButton.fragment";
import "./shaders/fluentButton.vertex";

import { RegisterFluentButtonMaterial } from "./fluentButtonMaterial.pure";
RegisterFluentButtonMaterial();
