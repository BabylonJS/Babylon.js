/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import openpbrMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./openpbrMaterial.pure";

import { RegisterOpenpbrMaterial } from "./openpbrMaterial.pure";
RegisterOpenpbrMaterial();
