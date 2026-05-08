/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import hemisphericLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./hemisphericLight.pure";

import { registerHemisphericLight } from "./hemisphericLight.pure";
registerHemisphericLight();
