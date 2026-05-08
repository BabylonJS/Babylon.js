/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrMetallicRoughnessMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMetallicRoughnessMaterial.pure";

import { registerPbrMetallicRoughnessMaterial } from "./pbrMetallicRoughnessMaterial.pure";
registerPbrMetallicRoughnessMaterial();
