/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pointLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pointLight.pure";

import { RegisterPointLight } from "./pointLight.pure";
RegisterPointLight();
