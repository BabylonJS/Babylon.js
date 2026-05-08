/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import directionalLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directionalLight.pure";

import { registerDirectionalLight } from "./directionalLight.pure";
registerDirectionalLight();
