/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fresnelParameters.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fresnelParameters.pure";

import { RegisterFresnelParameters } from "./fresnelParameters.pure";
RegisterFresnelParameters();
