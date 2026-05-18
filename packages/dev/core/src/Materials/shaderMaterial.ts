/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shaderMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shaderMaterial.pure";
export * from "./shaderMaterial.types";

import { RegisterShaderMaterial } from "./shaderMaterial.pure";
RegisterShaderMaterial();
