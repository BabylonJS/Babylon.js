/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMaterial.pure";

import { registerPbrMaterial } from "./pbrMaterial.pure";
registerPbrMaterial();
