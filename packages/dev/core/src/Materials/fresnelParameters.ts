/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fresnelParameters.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fresnelParameters.pure";

import { registerFresnelParameters } from "./fresnelParameters.pure";
registerFresnelParameters();
