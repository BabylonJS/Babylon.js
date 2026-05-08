/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rectAreaLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rectAreaLight.pure";

import { RegisterRectAreaLight } from "./rectAreaLight.pure";
RegisterRectAreaLight();
