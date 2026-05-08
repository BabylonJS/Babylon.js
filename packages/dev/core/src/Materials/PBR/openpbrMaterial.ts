/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import openpbrMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./openpbrMaterial.pure";

import { registerOpenpbrMaterial } from "./openpbrMaterial.pure";
registerOpenpbrMaterial();
