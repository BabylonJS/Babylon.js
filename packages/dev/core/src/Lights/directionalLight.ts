/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import directionalLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directionalLight.pure";

import { RegisterDirectionalLight } from "./directionalLight.pure";
RegisterDirectionalLight();
