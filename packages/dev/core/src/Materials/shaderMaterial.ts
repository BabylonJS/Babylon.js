/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shaderMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shaderMaterial.pure";

import { registerShaderMaterial } from "./shaderMaterial.pure";
registerShaderMaterial();
